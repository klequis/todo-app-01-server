import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { fourTodos } from 'test/fourTodos'
import {
  close,
  dropCollection,
  find,
  findById,
  findOne,
  findOneAndDelete,
  findOneAndUpdate,
  insertMany,
  insertOne
} from 'db'
import config from 'config'
import { isNil, isEmpty } from 'ramda'
import { yellow } from 'logger'

chai.use(chaiAsPromised)

const collectionName = 'todos'

const cfg = config()
const auth0UUID = cfg.testUser.auth0UUID

after(async () => {
  await close()
})

describe('dbFunctions failure cases', function() {
  it('should throw: collection name must be a String', async function() {
    await expect(find()).to.eventually.be.rejectedWith(
      Error,
      'collection name must be a String'
    )
  })
})

describe('dbFunctions success cases', function() {
  describe('test insertMany', function() {
    it('insertMany: should insert 4 todos', async function() {
      const ret = await insertMany(collectionName, fourTodos)
      expect(ret.length).to.equal(4)
    })
  })

  describe('test dropCollection', function() {
    before(async function() {
      await dropCollection(collectionName)
    })
    it('should return true', async function() {
      const dc1 = await dropCollection(collectionName)
      expect(dc1).to.equal(true)
      const dc2 = await dropCollection(collectionName)
      expect(dc2).to.equal(true)
    })
  })

  describe('test insertOne', function() {
    before(async function() {
      await dropCollection(collectionName)
      await insertMany(collectionName, fourTodos)
    })
    const newData = { title: 'todo added' }
    it('insertOne: should insert new document', async function() {
      const ret = await insertOne(collectionName, newData)
      expect(ret[0]._id).to.be.not.null
      expect(ret[0].title).to.equal('todo added')
    })
  })

  describe('test find', function() {
    before(async function() {
      await dropCollection(collectionName)
      await insertMany(collectionName, fourTodos)
    })
    it('find: should return 4 todos', async function() {
      const ret = await find(collectionName)
      expect(ret.length).to.equal(4)
    })
  })

  describe('test findById', function() {
    let idToFind = undefined
    before(async function() {
      await dropCollection(collectionName)
      const r = await insertMany(collectionName, fourTodos)
      idToFind = r[0]._id.toString()
    })
    it('findById: should return 1 todo with id of second todo', async function() {
      const r = await findById('todos', idToFind)
      yellow('r', r)
      expect(r.length).to.equal(1)
      const idFound = r[0]._id.toString()
      expect(idFound).to.equal(idToFind)
    })
  })

  describe('test findOneAndDelete', function() {
    let idToDelete = undefined
    before(async function() {
      await dropCollection(collectionName)
      const ret = await insertMany(collectionName, fourTodos)
      idToDelete = ret[1]._id.toString()
    })
    it('findOneAndDelete: should delete 1 of 4 todos', async function() {
      const ret = await findOneAndDelete(collectionName, { _id: idToDelete })
      const idDeleted = ret[0]._id.toString()
      expect(idDeleted).to.equal(idToDelete)
    })
  })

  describe('test findOneAndUpdate', function() {
    const newData = { title: 'changed title', completed: true }
    let idToUpdate = undefined
    before(async function() {
      await dropCollection(collectionName)
      const ret = await insertMany(collectionName, fourTodos)
      idToUpdate = ret[1]._id.toString()
      // yellow('idToUpdate', idToUpdate)
    })
    it('findOneAndUpdate: should return updated document', async function() {
      const ret = await findOneAndUpdate(
        collectionName,
        { _id: idToUpdate },
        newData
      )
      expect(ret[0]._id.toString()).to.equal(idToUpdate)
      expect(ret[0].title).to.equal(newData.title)
      expect(ret[0].completed).to.equal(newData.completed)
    })
  })

  describe('test findOne', function() {
    before(async function() {
      await dropCollection(collectionName)
      await insertMany(collectionName, fourTodos)
    })
    it('findOne valid userId: should return one document with _id', async function() {
      const r = await findOne(collectionName, { userId: auth0UUID }, { _id: 1 })
      const _idNil = isNil(r)
      expect(_idNil).to.equal(false)
    })
    it('findOne invalid userId: empty object', async function() {
      const r = await findOne(
        collectionName,
        { userId: 'auth0UUID' },
        { _id: 1 }
      )
      // yellow('r', isNil(r))
      const _idNil = isNil(r)
      // const { _id } = r
      expect(_idNil).to.equal(true)
    })
  })
})
