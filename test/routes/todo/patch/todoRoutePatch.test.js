import { expect } from 'chai'
import { fourTodos, patchErrors } from './patchFixture'
import { dropCollection, insertMany } from 'db'
import getToken from 'test/get-token'
import sendRequest from 'test/sendRequest'
import { TODO_COLLECTION_NAME } from 'routes/constants'
import { mergeRight } from 'ramda'
import { yellow } from 'logger'
import { isDateTimeAfter, findObjectInArray } from 'lib'
import {
  completedCheck,
  createdAtCheck,
  dueDateCheck,
  lastUpdatedAtCheck,
  mongoIdCheck,
  titleLengthCheck,
  userIdCheck,
} from 'routes/todo-route/validationChecks'

function patchUri(id) {
  return `/api/todo/${id}`
}

function getErrorByParam(param) {}

describe('todo-route PATCH', function() {
  let token = undefined
  before(async function() {
    token = await getToken()
  })
  describe('test PATCH /api/todo/:id', function() {
    let idToUpdate1
    let idToUpdate2
    before(async function() {
      await dropCollection(TODO_COLLECTION_NAME)
      const inserted = await insertMany(TODO_COLLECTION_NAME, fourTodos)
      idToUpdate1 = inserted[1]._id.toString()
      idToUpdate2 = inserted[2]._id.toString()
    })
    it('all fields valid - should return document with updated title, completed & lastUpdateAt', async function() {
      // use fourTodos[1]
      const originalTodo = fourTodos[1]
      const newData = mergeRight(originalTodo, {
        _id: idToUpdate1,
        title: 'changed title',
        completed: true
      })
      yellow('newData', newData)
      const r = await sendRequest({
        method: 'PATCH',
        uri: patchUri(newData._id),
        status: 200,
        body: newData,
        token
      })
      const { body } = r
      // length
      expect(body.length).to.equal(1)
      const modifiedTodo = body[0]
      // _id
      expect(modifiedTodo._id).to.equal(idToUpdate1)
      // completed
      expect(modifiedTodo.completed).to.equal(true)
      // dueDate
      expect(modifiedTodo.dueDate).to.equal(undefined)
      // lastUpdatedAt
      const origDate = fourTodos[1].lastUpdatedAt
      const modDate = modifiedTodo.lastUpdatedAt
      const after = isDateTimeAfter(origDate, modDate)
      expect(after).to.equal(true)
      // Title
      expect(modifiedTodo.title).to.equal(newData.title)
      // userId
      expect(modifiedTodo.userId).to.equal(newData.userId)
    })

    it('check field validation error messages - missing', async function() {
      const r = await sendRequest({
        method: 'PATCH',
        uri: patchUri(),
        status: 422,
        body: {},
        token
      })
      const { body } = r
      const { errors } = body
      // length
      expect(errors.length).to.equal(6)
      // _id
      expect(findObjectInArray(errors, 'param', 'id').msg).to.equal(
        mongoIdCheck.errorMessage
      )
      // completed
      expect(findObjectInArray(errors, 'param', 'completed').msg).to.equal(
        completedCheck.errorMessage
      )
      // createdAt
      expect(
        findObjectInArray(errors, 'param', 'createdAt').msg
      ).to.equal(createdAtCheck.errorMessage)
      // dueDate - is optional so no error will be found
      expect(findObjectInArray(errors, 'param', 'dueDate')).to.equal(undefined)
      // lastUpdatedAt
      expect(findObjectInArray(errors, 'param', 'lastUpdatedAt').msg).to.equal(
        lastUpdatedAtCheck.errorMessage
      )
      // title
      expect(findObjectInArray(errors, 'param', 'title').msg).to.equal(
        titleLengthCheck.errorMessage
      )
      // userId
      expect(findObjectInArray(errors, 'param', 'userId').msg).to.equal(
        userIdCheck.errorMessage
      )
    })
  })
})
