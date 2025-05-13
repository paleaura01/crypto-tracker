/// <reference types="@sveltejs/kit" />

// allow `import X from '*.svelte'`
declare module '*.svelte' {
    import { SvelteComponentTyped } from 'svelte';
    export default class Component<
      Props extends Record<string, any> = Record<string, any>,
      Events extends Record<string, any> = Record<string, any>,
      Slots extends Record<string, any> = Record<string, any>
    > extends SvelteComponentTyped<Props, Events, Slots> {}
  }
  
  // allow private env imports for server-only code
  declare module '$env/static/private';
  