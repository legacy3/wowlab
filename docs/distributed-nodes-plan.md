  Summary:
  - Database: New tables for nodes, access control, sim_configs (content-addressed), sim_jobs, sim_chunks
  - Rust crate: crates/wowlab-node/ with egui GUI, Supabase client, worker pool, config cache
  - Portal: Node management pages, claim flow, access settings UI
  - Claiming: 6-char code displayed in GUI, user enters on website
  - Cleanup: pg_cron daily job to delete nodes offline >30 days

⏺ User approved Claude's plan
  ⎿  Plan saved to: ~/.claude/plans/calm-squishing-stallman.md · /plan to edit
     Distributed Simulation Node System

     Overview

     A distributed compute pool where users contribute simulation nodes. Nodes connect to Supabase, receive work chunks via Realtime/polling, run the Rust engine natively, and report results. Users can share
     node access with guilds, friends, or make them public.

     Architecture

     Portal (apps/portal)
         │
         ├── Submit sim job → sim_jobs table
         │                         │
         │                         ▼
         │                    Scheduler (DB trigger or Edge Function)
         │                         │
         │                         ▼
         │                    sim_chunks (assigned to available nodes)
         │                         │
         └── Poll results ◄────────┼────────────────────────────────┐
                                   │                                │
                   ┌───────────────┼───────────────┐                │
                   ▼               ▼               ▼                │
              ┌─────────┐    ┌─────────┐    ┌─────────┐            │
              │ Node A  │    │ Node B  │    │ Node C  │            │
              │ (owner) │    │ (guild) │    │ (friend)│            │
              └────┬────┘    └────┬────┘    └────┬────┘            │
                   │              │              │                  │
                   └──────────────┴──────────────┘                  │
                                  │                                 │
                                  ▼                                 │
                           Run engine, update results ──────────────┘

     ---
     Phase 1: Database Schema

     New Tables

     File: supabase/migrations/XXXXXX_create_nodes_system.sql

     -- Simulation nodes (user-contributed compute)
     create table nodes (
       id uuid primary key default gen_random_uuid(),
       user_id uuid not null references auth.users(id) on delete cascade,
       name text not null,
       claim_code text unique,  -- 6-char code for initial claiming
       max_parallel int not null default 4,
       status text not null default 'pending',  -- pending, online, offline
       last_seen_at timestamptz,
       version text,  -- node binary version
       created_at timestamptz default now(),

       constraint valid_status check (status in ('pending', 'online', 'offline'))
     );

     -- Node access control
     create table node_access (
       id uuid primary key default gen_random_uuid(),
       node_id uuid not null references nodes(id) on delete cascade,
       access_type text not null,  -- owner, user, guild, public
       target_id text,  -- user_id, guild_id, or null for public
       created_at timestamptz default now(),

       constraint valid_access_type check (access_type in ('owner', 'user', 'guild', 'public'))
     );

     -- Simulation configs (content-addressed cache)
     create table sim_configs (
       hash text primary key,  -- sha256 of config JSON
       config jsonb not null,
       created_at timestamptz default now(),
       last_used_at timestamptz default now()
     );

     -- Simulation jobs
     create table sim_jobs (
       id uuid primary key default gen_random_uuid(),
       user_id uuid not null references auth.users(id),
       config_hash text not null references sim_configs(hash),
       total_iterations int not null,
       completed_iterations int default 0,
       status text not null default 'pending',  -- pending, running, completed, failed
       result jsonb,  -- aggregated result when complete
       created_at timestamptz default now(),
       completed_at timestamptz,

       constraint valid_job_status check (status in ('pending', 'running', 'completed', 'failed'))
     );

     -- Simulation chunks (work units)
     create table sim_chunks (
       id uuid primary key default gen_random_uuid(),
       job_id uuid not null references sim_jobs(id) on delete cascade,
       node_id uuid references nodes(id),
       config_hash text not null references sim_configs(hash),
       iterations int not null,
       seed_offset int not null,
       status text not null default 'pending',  -- pending, claimed, running, completed, failed
       result jsonb,
       claimed_at timestamptz,
       completed_at timestamptz,

       constraint valid_chunk_status check (status in ('pending', 'claimed', 'running', 'completed', 'failed'))
     );

     -- Indexes
     create index idx_nodes_user_id on nodes(user_id);
     create index idx_nodes_status on nodes(status) where status = 'online';
     create index idx_node_access_node_id on node_access(node_id);
     create index idx_node_access_target on node_access(access_type, target_id);
     create index idx_sim_chunks_node_pending on sim_chunks(node_id, status) where status = 'pending';
     create index idx_sim_chunks_job_id on sim_chunks(job_id);
     create index idx_sim_jobs_user_status on sim_jobs(user_id, status);

     -- Auto-cleanup: delete nodes not seen in 30 days
     create or replace function cleanup_stale_nodes()
     returns void as $$
     begin
       delete from nodes
       where last_seen_at < now() - interval '30 days'
         and status = 'offline';
     end;
     $$ language plpgsql security definer;

     -- Enable Realtime for chunks (nodes subscribe to their assignments)
     alter publication supabase_realtime add table sim_chunks;

     Access Control (in apps/portal/src/lib/refine/access-control.ts)

     // Add to existing access control checks
     if (resource === "nodes" && (action === "edit" || action === "delete")) {
       const { data } = await supabase
         .from("nodes")
         .select("user_id")
         .eq("id", params.id)
         .single();

       if (data?.user_id !== user.id) {
         return { can: false, reason: "Not owner" };
       }
     }

     ---
     Phase 2: Rust Node Binary

     New Crate Structure

     Location: crates/wowlab-node/ (Rust compute node, not Node.js!)

     crates/wowlab-node/
     ├── Cargo.toml
     ├── src/
     │   ├── main.rs           # Entry point, launches GUI
     │   ├── app.rs            # egui/iced application state
     │   ├── config.rs         # Node configuration (persisted)
     │   ├── ui/
     │   │   ├── mod.rs
     │   │   ├── claim_view.rs    # First-boot claiming UI
     │   │   ├── dashboard.rs     # Main status view
     │   │   ├── settings.rs      # Max parallel, name, etc.
     │   │   └── logs.rs          # Scrolling log view
     │   ├── supabase/
     │   │   ├── mod.rs
     │   │   ├── client.rs     # REST client for Supabase
     │   │   └── realtime.rs   # WebSocket subscription (or polling)
     │   ├── worker/
     │   │   ├── mod.rs
     │   │   ├── pool.rs       # Thread pool for parallel sims
     │   │   └── runner.rs     # Run engine, report results
     │   ├── cache/
     │   │   ├── mod.rs
     │   │   └── config_cache.rs  # Local disk + memory cache for configs
     │   └── claim.rs          # Claiming logic

     Cargo.toml

     [package]
     name = "wowlab-node"
     version = "0.1.0"
     edition = "2021"

     [[bin]]
     name = "wowlab-node"
     path = "src/main.rs"

     [dependencies]
     engine = { path = "../engine" }

     # GUI
     eframe = "0.29"  # egui framework (native + optional web)
     egui = "0.29"

     # Async runtime
     tokio = { version = "1", features = ["full"] }

     # HTTP & WebSocket
     reqwest = { version = "0.12", features = ["json"] }
     tokio-tungstenite = "0.24"

     # Serialization
     serde = { version = "1", features = ["derive"] }
     serde_json = "1"

     # Utils
     sha2 = "0.10"           # Config hashing
     directories = "5"       # XDG dirs (~/.wowlab/)
     uuid = { version = "1", features = ["v4"] }
     tracing = "0.1"
     tracing-subscriber = "0.3"
     rand = "0.8"            # Claim code generation

     [profile.release]
     opt-level = 3
     lto = true

     Main Flow (GUI Application)

     // src/main.rs
     fn main() -> eframe::Result<()> {
         // Start async runtime in background for network ops
         let runtime = tokio::runtime::Runtime::new().unwrap();

         let options = eframe::NativeOptions {
             viewport: egui::ViewportBuilder::default()
                 .with_inner_size([400.0, 500.0])
                 .with_icon(load_icon()),
             ..Default::default()
         };

         eframe::run_native(
             "WowLab Node",
             options,
             Box::new(|cc| Ok(Box::new(NodeApp::new(cc, runtime)))),
         )
     }

     // src/app.rs
     pub struct NodeApp {
         runtime: Arc<Runtime>,
         state: AppState,
         worker_pool: WorkerPool,
         supabase: SupabaseClient,
         logs: Vec<LogEntry>,
     }

     enum AppState {
         Claiming { code: String },           // Show claim code, waiting
         Dashboard { stats: NodeStats },      // Normal operation
         Settings,                            // Configuration view
     }

     impl eframe::App for NodeApp {
         fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
             // Top bar with status
             egui::TopBottomPanel::top("header").show(ctx, |ui| {
                 ui.horizontal(|ui| {
                     ui.heading("WowLab Node");
                     ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                         self.show_status_indicator(ui);
                     });
                 });
             });

             // Main content
             egui::CentralPanel::default().show(ctx, |ui| {
                 match &self.state {
                     AppState::Claiming { code } => self.show_claim_view(ui, code),
                     AppState::Dashboard { stats } => self.show_dashboard(ui, stats),
                     AppState::Settings => self.show_settings(ui),
                 }
             });

             // Bottom log panel
             egui::TopBottomPanel::bottom("logs").show(ctx, |ui| {
                 self.show_logs(ui);
             });

             // Request repaint for real-time updates
             ctx.request_repaint_after(Duration::from_millis(100));
         }
     }

     GUI Views

     // Claim view - shown on first boot
     fn show_claim_view(&self, ui: &mut egui::Ui, code: &str) {
         ui.vertical_centered(|ui| {
             ui.add_space(40.0);
             ui.heading("Claim this node");
             ui.add_space(20.0);
             ui.label("Visit wowlab.gg/nodes/claim");
             ui.add_space(10.0);

             // Big monospace claim code
             ui.add(
                 egui::Label::new(
                     egui::RichText::new(code)
                         .size(48.0)
                         .monospace()
                         .strong()
                 )
             );

             ui.add_space(20.0);
             ui.spinner();
             ui.label("Waiting for claim ...");
         });
     }

     // Dashboard - normal operation
     fn show_dashboard(&self, ui: &mut egui::Ui, stats: &NodeStats) {
         ui.columns(2, |cols| {
             cols[0].group(|ui| {
                 ui.heading("Status");
                 ui.label(format!("Active jobs: {}", stats.active_jobs));
                 ui.label(format!("Completed: {}", stats.completed_chunks));
                 ui.label(format!("Sims/sec: {:.0}", stats.sims_per_second));
             });

             cols[1].group(|ui| {
                 ui.heading("Resources");
                 ui.label(format!("Workers: {}/{}", stats.busy_workers, stats.max_workers));
                 ui.add(egui::ProgressBar::new(stats.cpu_usage).text("CPU"));
             });
         });
     }

     Config Cache

     // src/cache/config_cache.rs
     pub struct ConfigCache {
         memory: LruCache<String, String>,  // hash -> config JSON
         disk_path: PathBuf,  // ~/.wowlab/cache/configs/
     }

     impl ConfigCache {
         pub async fn get_or_fetch(&mut self, hash: &str, client: &SupabaseClient) -> Result<String> {
             // Check memory
             if let Some(config) = self.memory.get(hash) {
                 return Ok(config.clone());
             }

             // Check disk
             let disk_file = self.disk_path.join(hash);
             if disk_file.exists() {
                 let config = std::fs::read_to_string(&disk_file)?;
                 self.memory.put(hash.to_string(), config.clone());
                 return Ok(config);
             }

             // Fetch from Supabase
             let config = client.get_config(hash).await?;
             std::fs::write(&disk_file, &config)?;
             self.memory.put(hash.to_string(), config.clone());
             Ok(config)
         }
     }

     ---
     Phase 3: Portal Frontend

     New Routes

     apps/portal/src/app/
     ├── account/
     │   └── nodes/
     │       ├── page.tsx           # Node management dashboard
     │       ├── loading.tsx
     │       ├── claim/
     │       │   └── page.tsx       # Claim a node with code
     │       └── [nodeId]/
     │           ├── page.tsx       # Node details + access settings
     │           └── loading.tsx

     Components

     Location: apps/portal/src/components/nodes/

     components/nodes/
     ├── index.ts
     ├── nodes-list.tsx           # List user's nodes
     ├── nodes-list-skeleton.tsx
     ├── node-card.tsx            # Single node status card
     ├── node-claim-form.tsx      # Enter claim code
     ├── node-access-settings.tsx # Configure who can use the node
     ├── node-status-badge.tsx    # Online/offline/pending indicator
     └── available-nodes-list.tsx # Nodes user has access to (from others)

     Key UI Components

     Node Card:
     // Shows: name, status, max_parallel, last_seen, actions
     <Card>
       <CardHeader>
         <div className="flex items-center gap-2">
           <NodeStatusBadge status={node.status} />
           <CardTitle>{node.name}</CardTitle>
         </div>
       </CardHeader>
       <CardContent>
         <p>Max parallel: {node.max_parallel}</p>
         <p>Last seen: {formatRelative(node.last_seen_at)}</p>
       </CardContent>
       <CardFooter>
         <Button variant="outline" asChild>
           <Link href={`/account/nodes/${node.id}`}>Settings</Link>
         </Button>
       </CardFooter>
     </Card>

     Claim Form:
     // User enters 6-character code displayed by node binary
     <form onSubmit={handleClaim}>
       <Field>
         <FieldLabel>Claim Code</FieldLabel>
         <Input
           placeholder="ABC123"
           maxLength={6}
           className="font-mono text-center text-2xl tracking-widest"
         />
         <FieldDescription>
           Enter the code shown on your node
         </FieldDescription>
       </Field>
       <Button type="submit">Claim Node</Button>
     </form>

     Access Settings:
     // Configure who can use the node
     <RadioGroup value={accessType} onValueChange={setAccessType}>
       <RadioGroupItem value="owner">Only me</RadioGroupItem>
       <RadioGroupItem value="friends">My friends</RadioGroupItem>
       <RadioGroupItem value="guild">My guild</RadioGroupItem>
       <RadioGroupItem value="public">Anyone</RadioGroupItem>
     </RadioGroup>

     Hooks

     Location: apps/portal/src/hooks/nodes/

     // use-my-nodes.ts
     export function useMyNodes() {
       const { data: user } = useGetIdentity<UserIdentity>();
       return useList<Node>({
         resource: "nodes",
         filters: [{ field: "user_id", operator: "eq", value: user?.id }],
         sorters: [{ field: "created_at", order: "desc" }],
       });
     }

     // use-available-nodes.ts
     export function useAvailableNodes() {
       // Nodes I can use (my own + shared with me)
       // This needs a view or function to resolve access
     }

     // use-claim-node.ts
     export function useClaimNode() {
       const { mutateAsync } = useUpdate();
       return async (code: string, name: string) => {
         // Find node by claim_code, update user_id
       };
     }

     ---
     Phase 4: Node Claiming Flow

     Sequence

     1. User downloads/runs node binary
     2. Node generates random 6-char claim code
     3. Node displays: "Claim at wowlab.gg/nodes/claim - Code: ABC123"
     4. Node polls Supabase: SELECT * FROM nodes WHERE claim_code = 'ABC123'
     5. User visits /nodes/claim, enters code
     6. Portal: UPDATE nodes SET user_id = auth.uid(), status = 'online', claim_code = null WHERE claim_code = 'ABC123'
     7. Node detects user_id is set, proceeds to main loop

     Node-side claiming

     // src/claim.rs
     pub fn generate_code() -> String {
         // 6 alphanumeric characters (no confusing chars like 0/O, 1/l)
         const CHARSET: &[u8] = b"ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
         (0..6).map(|_| {
             let idx = rand::random::<usize>() % CHARSET.len();
             CHARSET[idx] as char
         }).collect()
     }

     pub async fn register_pending_node(client: &SupabaseClient, code: &str) -> Result<Uuid> {
         // INSERT INTO nodes (claim_code, status) VALUES ($1, 'pending') RETURNING id
         client.create_pending_node(code).await
     }

     pub async fn wait_for_claim(client: &SupabaseClient, node_id: Uuid) -> Result<()> {
         loop {
             let node = client.get_node(node_id).await?;
             if node.user_id.is_some() {
                 println!("Node claimed successfully!");
                 return Ok(());
             }
             tokio::time::sleep(Duration::from_secs(3)).await;
         }
     }

     ---
     Phase 5: Stale Node Cleanup (pg_cron)

     -- Add to migration file

     -- Enable pg_cron extension
     create extension if not exists pg_cron;

     -- Schedule daily cleanup at 3 AM UTC
     select cron.schedule(
       'cleanup-stale-nodes',
       '0 3 * * *',
       $$
         delete from nodes
         where last_seen_at < now() - interval '30 days'
           and status = 'offline';

         -- Also clean up orphaned configs not used in 7 days
         delete from sim_configs
         where last_used_at < now() - interval '7 days'
           and hash not in (select distinct config_hash from sim_jobs);
       $$
     );

     ---
     Phase 6: Job Scheduling & Result Aggregation

     Job Submission (Portal)

     // When user clicks "Run Simulation"
     async function submitSimJob(config: SimConfig, iterations: number) {
       const configJson = JSON.stringify(config);
       const configHash = sha256(configJson);

       // 1. Upsert config
       await supabase.from("sim_configs").upsert({
         hash: configHash,
         config: config,
       }, { onConflict: "hash" });

       // 2. Create job
       const { data: job } = await supabase.from("sim_jobs").insert({
         user_id: user.id,
         config_hash: configHash,
         total_iterations: iterations,
       }).select().single();

       // 3. Get available nodes
       const nodes = await getAvailableNodes(user.id);

       // 4. Create chunks
       const chunks = distributeWork(iterations, nodes);
       await supabase.from("sim_chunks").insert(chunks);

       return job.id;
     }

     Chunk Distribution

     function distributeWork(iterations: number, nodes: Node[]): ChunkInsert[] {
       const totalCapacity = nodes.reduce((sum, n) => sum + n.max_parallel, 0);
       const chunkSize = Math.ceil(iterations / totalCapacity);

       const chunks: ChunkInsert[] = [];
       let remaining = iterations;
       let seedOffset = 0;

       for (const node of nodes) {
         for (let i = 0; i < node.max_parallel && remaining > 0; i++) {
           const thisChunk = Math.min(chunkSize, remaining);
           chunks.push({
             node_id: node.id,
             iterations: thisChunk,
             seed_offset: seedOffset,
             status: "pending",
           });
           remaining -= thisChunk;
           seedOffset += thisChunk;
         }
       }

       return chunks;
     }

     Result Aggregation

     // Poll or subscribe to job completion
     async function waitForJob(jobId: string): Promise<SimResult> {
       // Poll sim_chunks for this job
       // When all completed, aggregate results
       // Update sim_jobs with final result
     }

     ---
     Implementation Order

     1. Database migrations - Tables, indexes, pg_cron cleanup
     2. Rust node crate - Project structure, Cargo.toml, basic app shell
     3. Supabase client in Rust - REST client, auth, polling
     4. Node claiming flow - Generate code, poll for claim, persist config
     5. Portal claim page - /account/nodes/claim with code input
     6. Portal node list - /account/nodes with owned nodes
     7. Node worker pool - Thread pool, run engine, report results
     8. Config cache - Disk + memory cache for sim configs
     9. Portal access settings - Share with user/guild/public
     10. Job submission integration - Portal → distributed nodes
     11. GUI polish - Dashboard, logs view, settings panel
     12. Cross-platform builds - CI for Windows/Mac/Linux binaries

     ---
     Key Files to Create/Modify

     New Files

     supabase/migrations/XXXXXX_create_nodes_system.sql

     crates/wowlab-node/
     ├── Cargo.toml
     ├── src/main.rs
     ├── src/app.rs
     ├── src/config.rs
     ├── src/claim.rs
     ├── src/ui/*.rs
     ├── src/supabase/*.rs
     ├── src/worker/*.rs
     └── src/cache/*.rs

     apps/portal/src/app/account/nodes/
     ├── page.tsx
     ├── loading.tsx
     ├── claim/page.tsx
     └── [nodeId]/page.tsx

     apps/portal/src/components/nodes/
     ├── index.ts
     ├── nodes-list.tsx
     ├── node-card.tsx
     ├── node-claim-form.tsx
     ├── node-access-settings.tsx
     └── node-status-badge.tsx

     apps/portal/src/hooks/nodes/
     ├── use-my-nodes.ts
     ├── use-available-nodes.ts
     └── use-claim-node.ts

     Modify

     Cargo.toml                                        # Add wowlab-node to workspace members
     apps/portal/src/lib/supabase/types.ts            # Add Node, SimJob, SimChunk types
     apps/portal/src/lib/refine/access-control.ts     # Add node ownership checks
     apps/portal/src/providers/refine-provider.tsx    # Add nodes, sim_jobs, sim_chunks resources
