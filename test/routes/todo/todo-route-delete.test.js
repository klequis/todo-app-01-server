import { expect } from 'chai'
import request from 'supertest'
import { fourTodos, oneTodo } from './fixture'
import app from 'server'
import { dropCollection, find, insertMany } from 'db'
import getToken from 'test/get-token'

const collectionName = 'todos'

const invalidMongoIdMsg = 'Parameter id must be a valid MongodDB hex string.'
const invalidMongoId = '5d0147d82bdf2864' // this id is truncated
const idNotFound = '5cfbe5bf4bc4b4f726a14852' // this is a valid id but not in the db

describe('test DELETE /api/todo/:id', function() {
  let _idToDelete = ''
  let token = undefined

  before(async function() {
    token = await getToken()

    await dropCollection(collectionName)
    await insertMany(collectionName, fourTodos)
    const r = await find(collectionName, {})
    expect(r.length).to.equal(4)
    const _id = r[1]._id // returns object
    // The _ids returned by find() are objects. However, in actual use
    // _ids will come from the client and will always be strings
    // Therefore, convert to string
    _idToDelete = _id.toHexString()
  })

  it('should delete one record', async function() {
    const r = await request(app)
      .delete(`/api/todo/${_idToDelete}`)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token.access_token}`)
      .send()
      .expect(200)
    const { body } = r
    expect(body[0].title).to.equal(fourTodos[1].title)
    expect(body[0].completed).to.equal(false)
  })

  it('should return invalid id', async function() {
    const r = await request(app)
      .delete(`/api/todo/${invalidMongoId}`)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token.access_token}`)
      .send()
      .expect(422)
    const { errors } = r.body
    expect(errors[0].msg).to.equal(invalidMongoIdMsg)
  })

  it('should return id not found', async function() {
    const r = await request(app)
      .delete(`/api/todo/${idNotFound}`)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token.access_token}`)
      .send()
      .expect(404)
    // console.log('r**', r)
  })
})
