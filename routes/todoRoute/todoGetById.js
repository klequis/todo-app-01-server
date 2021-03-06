import wrap from 'routes/wrap'
import { TODO_COLLECTION_NAME } from 'db/constants'
import { find } from 'db'
// import { green } from 'logger'

/**
 * @param {string} _id a valid MongoDB object id
 *
 * @return {object} 1 todo
 */
const todoGetById = wrap(async (req, res) => {

  const { params } = req
  // green('params', params)

  const  { userid: userId, todoid: _id } = params
  // green('userId', userId)
  // green('_id', _id)
  
  const td1 = await find(TODO_COLLECTION_NAME, { userId, _id })
  res.send(td1)
})

export default todoGetById
