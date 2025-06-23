// Test setup file for Vitest
// This file runs before all tests

// Mock DOM APIs that might be needed
Object.defineProperty(window, 'getSelection', {
  writable: true,
  value: () => ({
    removeAllRanges: () => {},
    addRange: () => {},
    rangeCount: 0,
    getRangeAt: () => ({
      startOffset: 0,
      setStart: () => {},
      setEnd: () => {},
      selectNodeContents: () => {},
      collapse: () => {}
    })
  })
});

// Mock document.createRange
Object.defineProperty(document, 'createRange', {
  writable: true,
  value: () => ({
    setStart: () => {},
    setEnd: () => {},
    selectNodeContents: () => {},
    collapse: () => {}
  })
});

// Basic console setup for tests
console.log('🧪 Test environment setup complete'); 