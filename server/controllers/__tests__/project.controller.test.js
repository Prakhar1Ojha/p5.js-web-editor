/**
 * @jest-environment node
 */
import { Request, Response } from 'jest-express';
import Project from '../../models/project';
import { User } from '../../models/user';
import {
  getProject,
  downloadProjectAsZip,
  changeProjectVisibility
} from '../project.controller';

jest.mock('../../models/project');
jest.mock('../../models/user');

function createMockProject(overrides = {}) {
  return {
    _id: 'project-123',
    visibility: 'Public',
    user: {
      _id: { equals: jest.fn().mockReturnValue(true) },
      username: 'owner'
    },
    files: [],
    ...overrides
  };
}

describe('project.controller', () => {
  beforeEach(() => {
    User.findByUsername = jest.fn();
  });

  describe('getProject()', () => {
    it('returns 404 if user does not exist', async () => {
      const request = new Request();
      request.setParams({ project_id: 'project-123', username: 'unknown' });
      const response = new Response();

      User.findByUsername.mockResolvedValue(null);

      await getProject(request, response);

      expect(response.status).toHaveBeenCalledWith(404);
      expect(response.send).toHaveBeenCalledWith({
        message: 'User with that username does not exist'
      });
    });

    it('returns 404 if project does not exist', async () => {
      const request = new Request();
      request.setParams({ project_id: 'project-123', username: 'owner' });
      const response = new Response();

      User.findByUsername.mockResolvedValue({ _id: 'user-1' });
      Project.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await getProject(request, response);

      expect(response.status).toHaveBeenCalledWith(404);
      expect(response.send).toHaveBeenCalledWith({
        message: 'Project with that id does not exist'
      });
    });

    it('returns 403 if private project is accessed by unauthenticated user', async () => {
      const request = new Request();
      request.setParams({ project_id: 'project-123', username: 'owner' });
      request.user = undefined;
      const response = new Response();

      const project = createMockProject({ visibility: 'Private' });
      User.findByUsername.mockResolvedValue({ _id: 'user-1' });
      Project.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(project)
      });

      await getProject(request, response);

      expect(response.status).toHaveBeenCalledWith(403);
      expect(response.send).toHaveBeenCalledWith({
        message: 'Project is private'
      });
    });

    it('returns 403 if private project is accessed by non-owner', async () => {
      const request = new Request();
      request.setParams({ project_id: 'project-123', username: 'owner' });
      request.user = { _id: 'other-user-id' };
      const response = new Response();

      const ownerId = { equals: jest.fn().mockReturnValue(false) };
      const project = createMockProject({
        visibility: 'Private',
        user: { _id: ownerId, username: 'owner' }
      });
      User.findByUsername.mockResolvedValue({ _id: 'user-1' });
      Project.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(project)
      });

      await getProject(request, response);

      expect(response.status).toHaveBeenCalledWith(403);
      expect(response.send).toHaveBeenCalledWith({
        message: 'Project is private'
      });
      expect(ownerId.equals).toHaveBeenCalledWith('other-user-id');
    });

    it('allows owner to access private project', async () => {
      const request = new Request();
      request.setParams({ project_id: 'project-123', username: 'owner' });
      request.user = { _id: 'owner-123' };
      const response = new Response();

      const ownerId = { equals: jest.fn().mockReturnValue(true) };
      const project = createMockProject({
        visibility: 'Private',
        user: { _id: ownerId, username: 'owner' }
      });
      User.findByUsername.mockResolvedValue({ _id: 'user-1' });
      Project.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(project)
      });

      await getProject(request, response);

      expect(response.status).not.toHaveBeenCalledWith(403);
      expect(response.json).toHaveBeenCalledWith(project);
    });

    it('allows anyone to access public project', async () => {
      const request = new Request();
      request.setParams({ project_id: 'project-123', username: 'owner' });
      request.user = undefined;
      const response = new Response();

      const project = createMockProject({ visibility: 'Public' });
      User.findByUsername.mockResolvedValue({ _id: 'user-1' });
      Project.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(project)
      });

      await getProject(request, response);

      expect(response.status).not.toHaveBeenCalledWith(403);
      expect(response.json).toHaveBeenCalledWith(project);
    });
  });

  describe('downloadProjectAsZip()', () => {
    it('returns 404 if project does not exist', async () => {
      const request = new Request();
      request.setParams({ project_id: 'project-123' });
      const response = new Response();

      Project.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      await downloadProjectAsZip(request, response);

      expect(response.status).toHaveBeenCalledWith(404);
      expect(response.send).toHaveBeenCalledWith({
        message: 'Project with that id does not exist'
      });
    });

    it('returns 403 if private project is accessed by unauthenticated user', async () => {
      const request = new Request();
      request.setParams({ project_id: 'project-123' });
      request.user = undefined;
      const response = new Response();

      const project = createMockProject({ visibility: 'Private' });
      Project.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(project)
      });

      await downloadProjectAsZip(request, response);

      expect(response.status).toHaveBeenCalledWith(403);
      expect(response.send).toHaveBeenCalledWith({
        message: 'Project is private'
      });
    });

    it('returns 403 if private project is accessed by non-owner', async () => {
      const request = new Request();
      request.setParams({ project_id: 'project-123' });
      request.user = { _id: 'other-user-id' };
      const response = new Response();

      const ownerId = { equals: jest.fn().mockReturnValue(false) };
      const project = createMockProject({
        visibility: 'Private',
        user: { _id: ownerId, username: 'owner' }
      });
      Project.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(project)
      });

      await downloadProjectAsZip(request, response);

      expect(response.status).toHaveBeenCalledWith(403);
      expect(response.send).toHaveBeenCalledWith({
        message: 'Project is private'
      });
      expect(ownerId.equals).toHaveBeenCalledWith('other-user-id');
    });
  });

  describe('changeProjectVisibility()', () => {
    it('updates visibility successfully when projectId is an id', async () => {
      const request = new Request();
      request.setBody({ projectId: 'project-123', visibility: 'Public' });
      request.user = { _id: 'owner-id' };
      const response = new Response();

      const mockProject = {
        _id: 'project-123',
        slug: 'my-project',
        user: { equals: jest.fn().mockReturnValue(true) }
      };
      const mockUpdated = {
        _id: 'project-123',
        visibility: 'Public',
        user: { username: 'owner' }
      };

      Project.findOne = jest.fn().mockResolvedValue(mockProject);
      const mockExec = jest.fn().mockResolvedValue(mockUpdated);
      const mockPopulate = jest.fn().mockReturnValue({ exec: mockExec });
      Project.findByIdAndUpdate = jest
        .fn()
        .mockReturnValue({ populate: mockPopulate });

      await changeProjectVisibility(request, response);

      expect(Project.findOne).toHaveBeenCalledWith({
        $or: [{ _id: 'project-123' }, { slug: 'project-123' }]
      });
      expect(Project.findByIdAndUpdate).toHaveBeenCalledWith(
        'project-123',
        { visibility: 'Public' },
        { new: true, runValidators: true }
      );
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith(mockUpdated);
    });

    it('updates visibility by project._id when projectId is a slug', async () => {
      const request = new Request();
      request.setBody({ projectId: 'my-project-slug', visibility: 'Public' });
      request.user = { _id: 'owner-id' };
      const response = new Response();

      const mockProject = {
        _id: 'project-id-456',
        slug: 'my-project-slug',
        user: { equals: jest.fn().mockReturnValue(true) }
      };
      const mockUpdated = {
        _id: 'project-id-456',
        slug: 'my-project-slug',
        visibility: 'Public',
        user: { username: 'owner' }
      };

      Project.findOne = jest.fn().mockResolvedValue(mockProject);
      const mockExec = jest.fn().mockResolvedValue(mockUpdated);
      const mockPopulate = jest.fn().mockReturnValue({ exec: mockExec });
      Project.findByIdAndUpdate = jest
        .fn()
        .mockReturnValue({ populate: mockPopulate });

      await changeProjectVisibility(request, response);

      expect(Project.findOne).toHaveBeenCalledWith({
        $or: [{ _id: 'my-project-slug' }, { slug: 'my-project-slug' }]
      });
      expect(Project.findByIdAndUpdate).toHaveBeenCalledWith(
        'project-id-456',
        { visibility: 'Public' },
        { new: true, runValidators: true }
      );
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith(mockUpdated);
    });

    it('returns 404 if project is not found', async () => {
      const request = new Request();
      request.setBody({ projectId: 'non-existent', visibility: 'Public' });
      request.user = { _id: 'user-id' };
      const response = new Response();

      Project.findOne = jest.fn().mockResolvedValue(null);

      await changeProjectVisibility(request, response);

      expect(response.status).toHaveBeenCalledWith(404);
      expect(response.json).toHaveBeenCalledWith({
        success: false,
        message: 'No project found.'
      });
    });

    it('returns 403 if user is not the owner', async () => {
      const request = new Request();
      request.setBody({ projectId: 'project-123', visibility: 'Public' });
      request.user = { _id: 'non-owner-id' };
      const response = new Response();

      Project.findOne = jest.fn().mockResolvedValue({
        _id: 'project-123',
        user: { equals: jest.fn().mockReturnValue(false) }
      });

      await changeProjectVisibility(request, response);

      expect(response.status).toHaveBeenCalledWith(403);
      expect(response.json).toHaveBeenCalledWith({
        success: false,
        message: 'Unauthorized action.'
      });
    });

    it('returns 400 if visibility value is invalid', async () => {
      const request = new Request();
      request.setBody({ projectId: 'project-123', visibility: 'InvalidValue' });
      request.user = { _id: 'owner-id' };
      const response = new Response();

      Project.findOne = jest.fn().mockResolvedValue({
        _id: 'project-123',
        user: { equals: jest.fn().mockReturnValue(true) }
      });

      await changeProjectVisibility(request, response);

      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid data.'
      });
    });

    it('does not leak the error object when the update fails', async () => {
      const request = new Request();
      request.setBody({ projectId: 'project-123', visibility: 'Private' });
      request.user = { _id: 'owner-id' };
      const response = new Response();
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const dbError = new Error('connection to mongo lost');
      Project.findOne = jest.fn().mockResolvedValue({
        _id: 'project-123',
        user: { equals: jest.fn().mockReturnValue(true) }
      });
      Project.findByIdAndUpdate = jest.fn().mockImplementation(() => {
        throw dbError;
      });

      await changeProjectVisibility(request, response);

      expect(response.status).toHaveBeenCalledWith(500);
      expect(response.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to change project visibility.'
      });
      expect(consoleError).toHaveBeenCalledWith(
        'Error in changeProjectVisibility:',
        dbError
      );
      consoleError.mockRestore();
    });
  });
});
