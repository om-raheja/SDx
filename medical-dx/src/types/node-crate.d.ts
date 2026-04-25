declare module 'node-crate' {
  export function connect(url: string, username: string, password: string): void;
  export function exec(query: string, params?: any[]): Promise<{ json: any[] }>;
}