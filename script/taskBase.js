const BASE_NAME = 'taskbase'
const BASE_VERSION = 1
const BASE_STORE = 'task'

class TaskBase extends HTMLElement {
  constructor() {
    super()
    const initBase = window.indexedDB.open(BASE_NAME, BASE_VERSION)

    initBase.onerror = ({ target }) => {
      console.log(target.error)
    }

    initBase.onsuccess = ({ target }) => {
      console.log('TaskBase initialized.')
      // save taskBase reference
      this.taskBase = target.result
      this.load()
    }

    initBase.onupgradeneeded = ({ target }) => {
      console.log('TaskBase upgrade needed.')

      const taskBase = target.result

      taskBase.onerror = (event) => {
        console.error(event.target.error)
      }

      // create an objectStore for tasks
      const taskStore = taskBase.createObjectStore(BASE_STORE, {
        autoIncrement: true,
      })

      // TODO: detect if IDB is empty and then seed. Otherwise, call some custom migration or leave WIP
      const addRequest = taskStore.add(SEED_TASK)

      addRequest.onsuccess = (event) => {
        console.log(`Added task ${event.target.result}`)
      }

      addRequest.onerror = (event) => {
        console.error(event.target.error)
      }
    }

    const saveEvents = [EVENT_BRANCH, EVENT_UPDATE, EVENT_EXPAND]
    saveEvents.forEach((eventName) => {
      this.addEventListener(eventName, this.save.bind(this))
    })
    this.addEventListener(EVENT_DELETE, this.delete.bind(this))
  }

  addRoot() {
    this.store('readwrite', (store) => {
      const task = structuredClone(NEW_TASK)
      const addRequest = store.add(task)

      addRequest.onsuccess = ({ target }) => {
        const taskId = target.result
        task.task_id = taskId

        // another request to save the DB key in task_id
        const putRequest = store.put(task, task.task_id)

        putRequest.onsuccess = () => {
          console.log(`Added task ${taskId}`)
          this.dispatchEvent(
            new CustomEvent(EVENT_RENDER, {
              bubbles: true,
              detail: {
                task,
                isRoot: true,
              },
            })
          )
        }

        putRequest.onerror = (event) => {
          console.error(event.target.error)
        }
      }

      return addRequest
    })
  }

  load() {
    console.log('Loading tasks...')

    this.store('readonly', (store) => {
      const readRequest = (store.openCursor().onsuccess = ({ target }) => {
        const cursor = target.result

        if (!cursor) {
          return console.log('Tasks loading complete.')
        }

        this.dispatchEvent(
          new CustomEvent(EVENT_RENDER, {
            bubbles: true,
            detail: {
              task: cursor.value,
              isRoot: true,
            },
          })
        )

        cursor.continue()
      })

      return readRequest
    })
  }

  delete(event) {
    let node = event.target
    // root task delete
    if (event.detail?.isRoot) {
      return this.store('readwrite', (store) => {
        const taskKey = node.task.task_id
        const deleteRequest = store.delete(taskKey)

        deleteRequest.onsuccess = () => {
          console.log(`Deleted task ${taskKey}`)
          // bubbles up to task view
        }

        return deleteRequest
      })
    }
    // branch task delete
    // is a root save
    this.save(event)
  }

  save({ detail, target, type }) {
    // when deleting a subtask, grab the parent
    const node = type === EVENT_DELETE ? target.parentElement : target

    // grab root element
    let root = target
    const pathLength = target.task.task_path.length
    if (pathLength > 1) {
      for (let i = 0; i < pathLength - 1; i++) {
        root = root.parentElement
      }
    }

    this.store('readwrite', (store) => {
      const putRequest = store.put(root.task, root.task.task_id)

      putRequest.onsuccess = (event) => {
        console.log(`Updated task ${event.target.result}`)
        if (type === EVENT_EXPAND) {
          // does not need a render
          return
        }

        this.dispatchEvent(
          new CustomEvent(EVENT_RENDER, {
            bubbles: true,
            detail: {
              node,
              task: detail.task,
            },
          })
        )
      }

      return putRequest
    })
  }

  store(operation, order) {
    const store = this.taskBase.transaction(BASE_STORE, operation).objectStore(BASE_STORE)

    const request = order(store)

    request.onerror = ({ target }) => {
      console.error(target.error)
    }

    return request
  }
}
