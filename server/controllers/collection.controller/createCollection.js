import Collection from '../../models/collection';

export default function createCollection(req, res) {
  const owner = req.user._id;
  const { name, description, slug } = req.body;

  const values = {
    owner,
    name,
    description,
    slug
  };

  function sendFailure(err = {}) {
    const code = err.name === 'ValidationError' ? 400 : err.code || 500;
    const message = err.message || 'Something went wrong';
    res.status(code).json({ success: false, message });
  }

  function sendSuccess(newCollection) {
    res.json(newCollection);
  }

  function populateReferences(newCollection) {
    return Collection.populate(newCollection, [
      { path: 'owner', select: ['id', 'username'] },
      {
        path: 'items.project',
        select: ['id', 'name', 'slug', 'visibility'],
        populate: {
          path: 'user',
          select: ['username']
        }
      }
    ]);
  }

  if (owner == null) {
    sendFailure({ code: 404, message: 'No user specified' });
    return null;
  }

  if (
    name !== undefined &&
    (typeof name !== 'string' || name.trim().length === 0)
  ) {
    sendFailure({ code: 400, message: 'Collection name cannot be empty' });
    return null;
  }

  if (name !== undefined && name.length > 100) {
    sendFailure({
      code: 400,
      message: 'Collection name cannot exceed 100 characters'
    });
    return null;
  }

  if (
    description !== undefined &&
    description !== null &&
    (typeof description !== 'string' || description.length > 500)
  ) {
    sendFailure({
      code: 400,
      message: 'Collection description cannot exceed 500 characters'
    });
    return null;
  }

  return Collection.create(values)
    .then(populateReferences)
    .then(sendSuccess)
    .catch(sendFailure);
}
