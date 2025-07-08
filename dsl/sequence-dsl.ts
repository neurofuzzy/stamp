import { Completion } from '@codemirror/autocomplete';

export const sequenceCommands: Completion[] = [
  { label: 'ONCE', type: 'keyword', detail: 'Generate values once then stop' },
  { label: 'REPEAT', type: 'keyword', detail: 'Cycle through values repeatedly' },
  { label: 'YOYO', type: 'keyword', detail: 'Alternate between forward and reverse order' },
  { label: 'SHUFFLE', type: 'keyword', detail: 'Randomize order, then cycle through shuffled values' },
  { label: 'RANDOM', type: 'keyword', detail: 'Pick values randomly' },
];

export const sequenceParameters: Completion[] = [
    { label: 'AS', type: 'keyword', detail: 'Alias the sequence' },
    { label: 'REPLACE', type: 'keyword', detail: 'Use raw values (default)' },
    { label: 'ADD', type: 'keyword', detail: 'Add to previous value' },
    { label: 'SUBTRACT', type: 'keyword', detail: 'Subtract from previous value' },
    { label: 'MULTIPLY', type: 'keyword', detail: 'Multiply with previous value' },
    { label: 'DIVIDE', type: 'keyword', detail: 'Divide by current value' },
    { label: 'LOG', type: 'keyword', detail: 'Logarithmic operation (natural log)' },
    { label: 'LOG2', type: 'keyword', detail: 'Logarithmic operation (base 2)' },
    { label: 'LOG10', type: 'keyword', detail: 'Logarithmic operation (base 10)' },
    { label: 'POW', type: 'keyword', detail: 'Power operation' },
];
