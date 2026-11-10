import Collection from '../collection';

describe('models/collection', () => {
  describe('collectionSchema validation', () => {
    it('validates default values', () => {
      const collection = new Collection();
      const error = collection.validateSync();
      expect(error).toBeUndefined();
      expect(collection.name).toBe('My collection');
    });

    it('validates name within 100 characters', () => {
      const collection = new Collection({
        name: 'a'.repeat(100),
        description: 'valid description'
      });
      const error = collection.validateSync();
      expect(error).toBeUndefined();
    });

    it('rejects name exceeding 100 characters', () => {
      const collection = new Collection({
        name: 'a'.repeat(101)
      });
      const error = collection.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.name).toBeDefined();
      expect(error.errors.name.kind).toBe('maxlength');
    });

    it('validates description within 500 characters', () => {
      const collection = new Collection({
        name: 'Test',
        description: 'a'.repeat(500)
      });
      const error = collection.validateSync();
      expect(error).toBeUndefined();
    });

    it('rejects description exceeding 500 characters', () => {
      const collection = new Collection({
        name: 'Test',
        description: 'a'.repeat(501)
      });
      const error = collection.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.description).toBeDefined();
      expect(error.errors.description.kind).toBe('maxlength');
    });
  });
});
