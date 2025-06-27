// Test setup for jsdom environment
import { beforeEach } from 'vitest';

beforeEach(() => {
  // Reset DOM between tests
  document.body.innerHTML = '';
}); 