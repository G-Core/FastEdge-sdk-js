// Example usage of the KvStore API

async function example() {
  try {
    // Open a store using the static factory method
    const myStore = KvStore.open('my-store-name');

    console.log('Store opened successfully');

    // Get a value (returns Uint8Array or null if not found)
    const value = myStore.get('some-key');
    if (value) {
      console.log('Value found:', new TextDecoder().decode(value));
    } else {
      console.log('Key not found');
    }

    // Scan for keys matching a pattern
    const keys = myStore.scan('user:*');
    console.log('Found keys:', keys);

    // Get sorted set values in a range
    const sortedValues = myStore.zrange('leaderboard', 0, 10);
    console.log('Top 10 values:', sortedValues);

    // Scan through a sorted set
    const sortedResults = myStore.zscan('leaderboard', 'player:*');
    sortedResults.forEach(([value, score]) => {
      console.log(`Player: ${new TextDecoder().decode(value)}, Score: ${score}`);
    });

    // Check if item exists in bloom filter
    const exists = myStore.bfExists('visited-urls', 'https://example.com');
    console.log('URL visited before:', exists);
  } catch (error) {
    console.error('KvStore error:', error.message);
  }
}

// Alternative: You could also create convenience methods for text operations
class TextKvStore {
  constructor(storeName) {
    this.store = KvStore.open(storeName);
  }

  getString(key) {
    const value = this.store.get(key);
    return value ? new TextDecoder().decode(value) : null;
  }

  // Add other text-based convenience methods...
}

// Usage with text wrapper
const textStore = new TextKvStore('my-text-store');
const textValue = textStore.getString('config-key');
