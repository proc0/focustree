const BASE_NAME = 'taskbase'
const BASE_STORE = 'task'
const BASE_VERSION = 1

class TaskBase extends TaskControl {
  model = {
    // id: 0,
    data: {
      // record: stateStart, stateEnd, timeStart, timeEnd
      record: [],
      states: STATES,
    },
    meta: {
      editing: true,
      focused: false,
      opened: false,
    },
    name: NEW_NAME,
    note: '',
    path: [0],
    state: 0,
    tree: [],
  }

  saveEvents = [
    EVENT_BRANCH,
    EVENT_EDIT,
    EVENT_EXPAND,
    EVENT_SAVE,
    EVENT_STATUS,
    EVENT_SYNC,
    EVENT_UPDATE,
  ]

  connectedCallback() {
    // initialize view
    this.parentElement.init()
  }

  constructor() {
    super()

    const openRequest = window.indexedDB.open(BASE_NAME, BASE_VERSION)
    openRequest.onerror = this.throwError('Initializing')
    openRequest.onupgradeneeded = this.upgrade.bind(this)
    openRequest.onsuccess = ({ target }) => {
      console.log('Initialization complete.')
      // save database reference
      this.database = target.result
      this.load()
    }

    // bind events
    this.addEventListener(EVENT_DELETE, this.delete.bind(this))
    this.saveEvents.forEach((eventName) => {
      this.addEventListener(eventName, this.save.bind(this))
    })
  }

  addRoot({ detail }) {
    let task = detail?.task

    if (!task) {
      // add default model
      task = structuredClone(this.model)
      // get new task path (order index of root)
      const rootIndex = this.getRootNodes().length
      task.path = [rootIndex >= 0 ? rootIndex : 0]
    }

    // save root task
    this.transact('readwrite', (store) => {
      const addRootRequest = store.add(task)
      addRootRequest.onsuccess = ({ target }) => {
        task.id = target.result
        // another request to save the DB key in id
        const putRequest = store.put(task, task.id)
        putRequest.onerror = this.throwError('Adding Root')
        putRequest.onsuccess = () => {
          console.log(`Added root ${task.id}.`)
          this.dispatch(EVENT_RENDER_ROOT, { task })
        }
      }

      return addRootRequest
    })
  }

  delete(event) {
    const node = event.target
    // root task
    if (node.task.id) {
      // bubbles up to task view
      return this.transact('readwrite', (store) => {
        const taskId = node.task.id
        const deleteRequest = store.delete(taskId)
        deleteRequest.onsuccess = () => console.log(`Deleted task ${taskId}.`)

        return deleteRequest
      })
    }
    // branch task
    return this.save(event)
  }

  dispatch(eventName, detail) {
    return this.dispatchEvent(new CustomEvent(eventName, { bubbles: true, detail }))
  }

  export() {
    console.log('Exporting...')
    this.transact('readonly', (store) => {
      const readRequest = store.getAll()
      readRequest.onsuccess = ({ target }) => {
        const tasks = target.result
        console.log(tasks)
        const a = document.createElement('a')
        a.href = URL.createObjectURL(
          new Blob([JSON.stringify(tasks, null, 2)], {
            type: 'text/plain',
          })
        )
        a.setAttribute('download', 'tasks.json')
        this.appendChild(a)
        a.click()
        this.removeChild(a)
      }

      return readRequest
    })
  }

  import() {
    console.log('Importing...')

    const input = document.createElement('input')
    input.setAttribute('type', 'file')
    input.addEventListener('change', (event) => {
      const file = event.target.files[0]
      if (!file) {
        return this.throwError('No file provided.')
      }

      const reader = new FileReader()
      reader.onerror = this.throwError(`Reading file ${file}`)
      reader.onload = () => {
        // parse tasks
        const tasks = JSON.parse(reader.result)
        // save tasks
        this.transact('readwrite', (store) => {
          tasks.forEach((task) => {
            const addRequest = store.add(task, task.id)
            addRequest.onerror = this.throwError('Importing')
            addRequest.onsuccess = ({ target }) => {
              console.log(`Imported task ${target.result}`)
              this.dispatch(EVENT_RENDER_ROOT, { task })
            }
          })
        })

        input.remove()
      }

      reader.readAsText(file)
    })

    input.click()
  }

  load() {
    console.log('Loading...')
    this.transact('readonly', (store) => {
      const loadRequest = store.getAll()
      loadRequest.onsuccess = ({ target }) => {
        console.log('Loading complete.')
        this.dispatch(EVENT_RENDER, { tasks: target.result })
      }

      return loadRequest
    })
  }

  mapSave(transform = (a) => a) {
    this.transact('readwrite', (store) => {
      const loadRequest = store.getAll()
      loadRequest.onsuccess = ({ target }) => {
        const result = target.result
        // sort tasks based on path
        result.sort((a, b) => {
          return a.path[0] > b.path[0] ? 1 : -1
        })
        // transform callback
        const tasks = transform(result)
        const saveTask = (task, index) => {
          // root tasks
          if (task.id) {
            // save root task
            const putRequest = store.put(task, task.id)
            putRequest.onerror = this.throwError(`Saving root task ${task.id}`)
            putRequest.onsuccess = ({ target }) => {
              console.log(`Saved root task ${task.id}.`)
              if (index === tasks.length - 1) {
                this.dispatch(EVENT_RENDER, { tasks })
              }
            }
          } else {
            // promote branch to root
            const addRequest = store.add(task)
            addRequest.onsuccess = (event) => {
              task.id = event.target.result
              // another request to save the DB key in id
              const putRequest = store.put(task, task.id)
              putRequest.onerror = this.throwError(`Promoting to root task ${task.id}`)
              putRequest.onsuccess = () => {
                console.log(`Promoted root task ${task.id}`)
                if (index === tasks.length - 1) {
                  this.dispatch(EVENT_RENDER, { tasks })
                }
              }
            }
          }
        }

        tasks.forEach(saveTask)
      }

      return loadRequest
    })
  }

  migrate(migration, target) {
    if (!migration || !target.transaction) return
    // version upgrade migration
    const store = target.transaction.objectStore(BASE_STORE)
    const cursorRequest = store.openCursor()
    cursorRequest.onerror = this.throwError('Migrating')
    cursorRequest.onsuccess = ({ target }) => {
      const cursor = target.result
      if (!cursor) {
        return console.log('Migration complete.')
      }
      // migrate task and subtasks
      const model = cursor.value
      this.transformTask(migration, model)
      // save task migration
      const putRequest = store.put(model, model.id)
      putRequest.onerror = this.throwError(`Migrating task ${model.id}`)
      putRequest.onsuccess = (success) => {
        console.log(`Migrated task ${success.target.result}.`)
      }

      cursor.continue()
    }
  }

  save(event) {
    // stop save events except expand,
    // to allow view to handle it
    if (event.type !== EVENT_EXPAND) {
      event.stopPropagation()
    }

    // add new task if branching
    const task = event.detail.task
    if (event.type === EVENT_BRANCH) {
      // create new task and add path
      const newTask = structuredClone(this.model)
      newTask.path = [...task.path, task.tree.length]
      task.tree.push(newTask)
      // open drawer
      task.meta.opened = true
    }

    if (event.type === EVENT_STATUS) {
      // limit history to prevent bloat
      if (task.data.record.length > 99) {
        task.data.record.splice(50)
      }
    }

    if (event.type === EVENT_SYNC) {
      // sync all task tree states
      this.transformTask((sub) => {
        sub.state = task.state
      }, task)
    }

    let node = event.target
    // when deleting a subtask,
    if (event.type === EVENT_DELETE) {
      // grab the parent
      node = event.target.parentElement
    }

    // grab root element
    const root = event.target.getRootNode()
    // save task
    this.transact('readwrite', (store) => {
      const putRequest = store.put(root.task, root.task.id)
      putRequest.onsuccess = (success) => {
        console.log(`Updated task ${success.target.result}`)
        // skip render for expand event
        if (event.type === EVENT_EXPAND) return

        this.dispatch(EVENT_RENDER_BRANCH, { task, node })
      }

      return putRequest
    })
  }

  seed(database) {
    console.log('Seeding...')
    // create an objectStore for tasks
    const store = database.createObjectStore(BASE_STORE, {
      keypath: 'id',
      autoIncrement: true,
    })
    // create search indices
    store.createIndex('name', 'name')
    // prepare task seed
    const taskSeed = structuredClone(TUTORIAL || this.model)
    // root task
    taskSeed.id = 1
    // seed store
    const seedRequest = store.add(taskSeed)
    seedRequest.onerror = this.throwError('Seeding')
    seedRequest.onsuccess = (event) => {
      console.log('Seeding complete.')
    }
  }

  throwError(context) {
    return ({ target }) => {
      throw new Error(`${context} Error!`, { cause: target.error })
    }
  }

  transact(operation, order) {
    const transaction = this.database.transaction(BASE_STORE, operation)
    const store = transaction.objectStore(BASE_STORE)

    const request = order(store)
    if (request) {
      request.onerror = this.throwError('Transaction')
    }

    return request
  }

  upgrade({ target }) {
    console.log('Upgrade needed.')
    const database = target.result
    database.onerror = this.throwError('Upgrading')
    // database does not exist
    if (!database.objectStoreNames.contains(BASE_STORE)) {
      this.seed(database)
    } else {
      // define migration function for version upgrades
      // if (oldVersion === 1) { // get oldVersion from event.oldVersion
      //   console.log(`Migrating version ${oldVersion} to ${database.version}.`)
      //   migration = (task) => { /* modify task to new version here */ }
      // }
      let migration = null
      this.migrate(migration, target)
    }
  }
}
