/**
 * @jest-environment node
 */
import { Request, Response } from 'jest-express';
import Collection from '../../../models/collection';
import createCollection from '../createCollection';
import updateCollection from '../updateCollection';

jest.mock('../../../models/collection');

describe('collection.controller', () => {
  let request;
  let response;

  beforeEach(() => {
    request = new Request();
    response = new Response();
    Collection.create = jest.fn();
    Collection.populate = jest.fn();
    Collection.findOneAndUpdate = jest.fn();
    jest.clearAllMocks();
  });

  afterEach(() => {
    request.resetMocked();
    response.resetMocked();
  });

  describe('createCollection', () => {
    it('returns 404 if user is not specified', async () => {
      request.user = {};
      request.body = { name: 'My Collection' };

      await createCollection(request, response);

      expect(response.status).toHaveBeenCalledWith(404);
      expect(response.json).toHaveBeenCalledWith({
        success: false,
        message: 'No user specified'
      });
    });

    it('returns 400 if collection name is empty string', async () => {
      request.user = { _id: 'user123' };
      request.body = { name: '   ' };

      await createCollection(request, response);

      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith({
        success: false,
        message: 'Collection name cannot be empty'
      });
    });

    it('returns 400 if collection name exceeds 100 characters', async () => {
      request.user = { _id: 'user123' };
      request.body = { name: 'a'.repeat(101) };

      await createCollection(request, response);

      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith({
        success: false,
        message: 'Collection name cannot exceed 100 characters'
      });
    });

    it('returns 400 if collection description exceeds 500 characters', async () => {
      request.user = { _id: 'user123' };
      request.body = { name: 'Valid Name', description: 'd'.repeat(501) };

      await createCollection(request, response);

      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith({
        success: false,
        message: 'Collection description cannot exceed 500 characters'
      });
    });

    it('successfully creates collection when inputs are valid', async () => {
      const mockCollection = { id: 'col123', name: 'Valid Name' };
      request.user = { _id: 'user123' };
      request.body = { name: 'Valid Name', description: 'Valid Description' };

      Collection.create.mockResolvedValue(mockCollection);
      Collection.populate.mockResolvedValue(mockCollection);

      await createCollection(request, response);

      expect(Collection.create).toHaveBeenCalledWith({
        owner: 'user123',
        name: 'Valid Name',
        description: 'Valid Description',
        slug: undefined
      });
      expect(response.json).toHaveBeenCalledWith(mockCollection);
    });
  });

  describe('updateCollection', () => {
    it('returns 400 if updated collection name is empty string', async () => {
      request.params = { id: 'col123' };
      request.user = { _id: 'user123' };
      request.body = { name: '   ' };

      await updateCollection(request, response);

      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith({
        success: false,
        message: 'Collection name cannot be empty'
      });
    });

    it('returns 400 if updated collection name exceeds 100 characters', async () => {
      request.params = { id: 'col123' };
      request.user = { _id: 'user123' };
      request.body = { name: 'a'.repeat(101) };

      await updateCollection(request, response);

      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith({
        success: false,
        message: 'Collection name cannot exceed 100 characters'
      });
    });

    it('returns 400 if updated collection description exceeds 500 characters', async () => {
      request.params = { id: 'col123' };
      request.user = { _id: 'user123' };
      request.body = { description: 'd'.repeat(501) };

      await updateCollection(request, response);

      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith({
        success: false,
        message: 'Collection description cannot exceed 500 characters'
      });
    });

    it('updates collection when inputs are valid', async () => {
      const mockPopulate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ id: 'col123', name: 'Updated' })
      });
      Collection.findOneAndUpdate.mockReturnValue({
        populate: mockPopulate
      });

      request.params = { id: 'col123' };
      request.user = { _id: 'user123' };
      request.body = { name: 'Updated', description: 'Updated Desc' };

      await updateCollection(request, response);

      expect(Collection.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'col123', owner: 'user123' },
        { name: 'Updated', description: 'Updated Desc' },
        { new: true, runValidators: true, setDefaultsOnInsert: true }
      );
      expect(response.json).toHaveBeenCalledWith({
        id: 'col123',
        name: 'Updated'
      });
    });
  });
});
