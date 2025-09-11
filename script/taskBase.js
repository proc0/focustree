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
    const initBase = window.indexedDB.open(BASE_NAME, BASE_VERSION)

    initBase.onerror = this.throwError('Initializing')
    initBase.onsuccess = ({ target }) => {
      console.log('Initialization complete.')
      // save database reference
      this.taskBase = target.result
      this.loadAll()
    }

    initBase.onupgradeneeded = ({ target }) => {
      console.log('Upgrade needed.')
      const taskBase = target.result
      taskBase.onerror = this.throwError('Upgrading')
      // database does not exist
      if (!taskBase.objectStoreNames.contains(BASE_STORE)) {
        this.createStore(taskBase)
      } else {
        // define migration function for version upgrades
        // if (oldVersion === 1) { // get oldVersion from event.oldVersion
        //   console.log(`Migrating version ${oldVersion} to ${taskBase.version}.`)
        //   migration = (task) => { /* modify task to new version here */ }
        // }
        let migration = null
        this.upgrade(migration, target)
      }
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
        // only root tasks have id
        putRequest.onerror = this.throwError('Adding Root')
        putRequest.onsuccess = () => {
          console.log(`Added root ${task.id}.`)
          this.dispatchEvent(
            new CustomEvent(EVENT_RENDER_ROOT, {
              bubbles: true,
              detail: {
                task,
              },
            })
          )
        }
      }

      return addRootRequest
    })
  }

  createStore(taskBase) {
    // create an objectStore for tasks
    const store = taskBase.createObjectStore(BASE_STORE, {
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
        conosole.Error('No file selected. Please choose a file.')
        return
      }

      const reader = new FileReader()

      reader.onload = () => {
        const tasks = JSON.parse(reader.result)
        console.log(tasks)

        this.transact('readwrite', (store) => {
          tasks.forEach((task) => {
            const addRequest = store.add(task, task.id)

            addRequest.onsuccess = ({ target }) => {
              console.log(`Imported task ${target.result}`)
              this.dispatchEvent(
                new CustomEvent(EVENT_RENDER_ROOT, {
                  bubbles: true,
                  detail: {
                    task,
                  },
                })
              )
            }

            addRequest.onerror = (event) => {
              console.error(event.target.error)
            }
          })
        })
        input.remove()
      }

      reader.onerror = () => {
        conosole.Error('Error reading the file. Please try again.')
      }
      reader.readAsText(file)
    })

    input.click()
  }

  // load() {
  //   console.log('Loading...')
  //   this.transact('readonly', (store) => {
  //     const cursorRequest = store.openCursor()
  //     cursorRequest.onsuccess = ({ target }) => {
  //       const cursor = target.result
  //       if (!cursor) {
  //         return console.log('Loading complete.')
  //       }

  //       this.dispatchEvent(
  //         new CustomEvent(EVENT_RENDER_ROOT, {
  //           bubbles: true,
  //           detail: {
  //             task: cursor.value,
  //           },
  //         })
  //       )

  //       cursor.continue()
  //     }

  //     return cursorRequest
  //   })
  // }

  loadAll() {
    console.log('Loading all tasks...')
    this.transact('readonly', (store) => {
      const loadRequest = store.getAll()
      loadRequest.onsuccess = ({ target }) => {
        console.log('Loading complete.')
        this.dispatchEvent(
          new CustomEvent(EVENT_RENDER, {
            bubbles: true,
            detail: {
              tasks: target.result,
            },
          })
        )
      }

      return loadRequest
    })
  }

  mapSave(transform) {
    const requestAll = this.transact('readwrite', (store) => {
      const readRequest = store.getAll()

      let tasks = []
      readRequest.onsuccess = ({ target }) => {
        const result = target.result
        // sort tasks based on path
        result.sort((a, b) => {
          return a.path[0] > b.path[0] ? 1 : -1
        })

        tasks = transform(result)
        tasks.forEach((task, index) => {
          // root tasks
          if (task.id) {
            // save updated tasks
            const putRequest = store.put(task, task.id)

            putRequest.onsuccess = ({ target }) => {
              console.log(`Updated task ${task.id}`)

              if (index === tasks.length - 1) {
                this.dispatchEvent(
                  new CustomEvent(EVENT_RENDER, {
                    bubbles: true,
                    detail: {
                      tasks,
                    },
                  })
                )
              }
            }

            putRequest.onerror = (event) => {
              console.error(event.target.error)
            }
          } else {
            // promote branch to root
            const addRequest = store.add(task)
            addRequest.onsuccess = (event) => {
              task.id = event.target.result
              // another request to save the DB key in id
              const putRequest = store.put(task, task.id)
              // only root tasks have id
              putRequest.onsuccess = () => {
                console.log(`Added new root task ${task.id}`)

                if (index === tasks.length - 1) {
                  this.dispatchEvent(
                    new CustomEvent(EVENT_RENDER, {
                      bubbles: true,
                      detail: {
                        tasks,
                      },
                    })
                  )
                }
              }

              putRequest.onerror = (event) => {
                console.error(event.target.error)
              }
            }
          }
        })
      }

      return readRequest
    })
  }

  save(event) {
    // stop save events except expand,
    // to allow view to handle it
    if (event.type !== EVENT_EXPAND) {
      event.stopPropagation()
    }

    let node = event.target
    // when deleting a subtask,
    if (event.type === EVENT_DELETE) {
      // grab the parent
      node = event.target.parentElement
    }

    //TODO: use getRootNode
    // grab root element
    let root = event.target
    const pathLength = event.target.task.path.length
    if (pathLength > 1) {
      for (let i = 0; i < pathLength - 1; i++) {
        root = root.parentElement
      }
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
      // limit history to prevent large db size
      if (task.data.record.length > 99) {
        task.data.record.splice(50)
      }
    }

    if (event.type === EVENT_SYNC) {
      //TODO: use this.transformTask
      // DFS sync all states to the event task
      const syncStates = (t) => {
        t.state = task.state

        if (!t.tree.length) return

        t.tree.forEach((s) => {
          s.state = task.state
          syncStates(s)
        })
      }

      syncStates(task)
    }

    // save task
    this.transact('readwrite', (store) => {
      const putRequest = store.put(root.task, root.task.id)
      putRequest.onsuccess = (success) => {
        console.log(`Updated task ${success.target.result}`)
        // skip render for expand event
        if (event.type === EVENT_EXPAND) return
        //TODO: abstract event dispatcher
        this.dispatchEvent(
          new CustomEvent(EVENT_RENDER_BRANCH, { bubbles: true, detail: { task, node } })
        )
      }

      return putRequest
    })
  }

  throwError(context) {
    return ({ target }) => {
      throw new Error(`${context} Error!`, { cause: target.error })
    }
  }

  transact(operation, order) {
    const transaction = this.taskBase.transaction(BASE_STORE, operation)
    const store = transaction.objectStore(BASE_STORE)

    const request = order(store)
    if (request) {
      request.onerror = this.throwError('Transaction')
    }

    return request
  }

  upgrade(migration, target) {
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
      this.transformTask(model, migration)
      // save task migration
      const putRequest = store.put(model, model.id)
      putRequest.onerror = this.throwError(`Migrating task ${model.id}`)
      putRequest.onsuccess = (success) => {
        console.log(`Migrated task ${success.target.result}.`)
      }

      cursor.continue()
    }
  }
}
