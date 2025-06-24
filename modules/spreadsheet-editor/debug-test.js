import { StampDSL } from './src/core/services/StampDSL.js';

const dsl = new StampDSL();
console.log('Valid commands:', dsl.getValidCommands());
console.log('Is "ra" valid command?', dsl.getValidCommands().includes('ra'));
console.log('Commands starting with "ra":', dsl.getValidCommands().filter(cmd => cmd.toLowerCase().startsWith('ra')));

// Test in parameter context
console.log('Circle parameters:', dsl.getValidParameters('circle'));
console.log('Is "ra" valid for circle?', dsl.getValidParameters('circle').includes('ra'));
console.log('Circle params starting with "ra":', dsl.getValidParameters('circle').filter(param => param.toLowerCase().startsWith('ra'))); 