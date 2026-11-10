import { omitBy, isUndefined } from 'lodash';
import Collection from '../../models/collection';

function removeUndefined(obj) {
  return omitBy(obj, isUndefined);
}

export default function updateCollection(req, res) {
  const { id: collectionId } = req.params;
  const owner = req.user._id;
  const { name, description, slug } = req.body;

  const values = removeUndefined({
    name,
    description,
    slug
  });

  function sendFailure(err = {}) {
    const code = err.name === 'ValidationError' ? 400 : err.code || 500;
    const message = err.message || 'Something went wrong';
    res.status(code).json({ success: false, message });
  }

  function sendSuccess(collection) {
    if (collection == null) {
      sendFailure({
        code: 404,
        message: 'Not found, or you user does not own this collection'
      });
      return;
    }

    res.json(collection);
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

  async function findAndUpdateCollection() {
    // Only update if owner matches current user
    return Collection.findOneAndUpdate({ _id: collectionId, owner }, values, {
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true
    })
      .populate([
        { path: 'owner', select: ['id', 'username'] },
        {
          path: 'items.project',
          select: ['id', 'name', 'slug', 'visibility'],
          populate: {
            path: 'user',
            select: ['username']
          }
        }
      ])
      .exec();
  }

  return findAndUpdateCollection().then(sendSuccess).catch(sendFailure);
}
