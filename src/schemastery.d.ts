declare module "@deepseek-ai/schemastery" {
  type VolatileString = {
    default(value: string): { volatile(): unknown };
  };
  interface SchemaBuilder {
    object(shape: Record<string, unknown>): unknown;
    string(): VolatileString;
  }
  const z: SchemaBuilder;
  export default z;
}
