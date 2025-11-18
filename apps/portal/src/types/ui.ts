export interface TabSectionLayout {
  readonly id: string;
  readonly title: string;
  readonly visible: boolean;
  readonly keepAlive?: boolean;
  readonly order: number;
}
