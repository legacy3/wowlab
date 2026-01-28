/**
 * Available Prometheus metrics from our services.
 *
 * ## Sentinel (sentinel.wowlab.gg/metrics)
 * Distributed task coordination service.
 *
 * Gauges:
 *   - sentinel_uptime_seconds          Server uptime in seconds
 *   - sentinel_nodes_online            Number of worker nodes currently online
 *   - sentinel_chunks_pending          Number of chunks waiting to be assigned
 *   - sentinel_chunks_running          Number of chunks currently being processed
 *
 * Counters:
 *   - sentinel_chunks_assigned_total       Total chunks assigned to workers
 *   - sentinel_chunks_reclaimed_total      Total chunks reclaimed from failed workers
 *   - sentinel_nodes_marked_offline_total  Total nodes marked offline
 *   - sentinel_stale_data_cleanups_total   Total stale data cleanup operations
 *
 * ## Beacon (beacon.wowlab.gg/metrics)
 * Real-time WebSocket messaging via Centrifugo.
 *
 * Gauges:
 *   - centrifugo_node_num_clients                  Connected clients
 *   - centrifugo_node_num_channels                 Active channels
 *   - centrifugo_node_num_subscriptions            Total subscriptions
 *   - centrifugo_node_num_users                    Unique users
 *   - centrifugo_node_num_nodes                    Cluster nodes
 *   - centrifugo_client_connections_inflight       Connections in handshake
 *   - centrifugo_broker_redis_pub_sub_buffered_messages  Redis PubSub buffer
 *
 * Counters:
 *   - centrifugo_node_messages_sent_count          Messages sent to broker
 *   - centrifugo_node_messages_received_count      Messages received from broker
 *   - centrifugo_client_connections_accepted       Total connections accepted
 *   - centrifugo_transport_messages_sent           Messages sent to clients
 *   - centrifugo_transport_messages_received       Messages received from clients
 *   - centrifugo_transport_messages_sent_size      Bytes sent to clients
 *   - centrifugo_transport_messages_received_size  Bytes received from clients
 *   - centrifugo_client_num_reply_errors           Client reply errors
 *   - centrifugo_broker_redis_pub_sub_dropped_messages  Dropped Redis messages
 *   - centrifugo_node_action_count                 Various node actions (add_client, remove_client, etc.)
 *
 * Histograms:
 *   - centrifugo_client_ping_pong_duration_seconds   Ping/pong latency
 *   - centrifugo_node_pub_sub_lag_seconds            PubSub lag
 *   - centrifugo_api_command_duration_seconds        API command duration
 *   - centrifugo_client_command_duration_seconds     Client command duration
 */
export { MetricsContent } from "./metrics-content";
