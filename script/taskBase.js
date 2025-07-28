const BASE_NAME = 'taskbase'
const BASE_VERSION = 1
const BASE_STORE = 'task'

class TaskBase extends HTMLElement {
  constructor() {
    super()
    const initBase = window.indexedDB.open(BASE_NAME, BASE_VERSION)

    initBase.onerror = (event) => {
      console.log(event.target.error)
    }

    initBase.onsuccess = (event) => {
      console.log('TaskBase initialized.')
      // save taskBase reference
      this.taskBase = event.target.result
      this.load()
    }

    initBase.onupgradeneeded = (event) => {
      console.log('TaskBase upgrade needed.')

      const taskBase = event.target.result

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

      addRequest.onsuccess = (event) => {
        const taskId = event.target.result

        task.task_id = taskId
        // another request to save the DB key in task_id
        const putRequest = store.put(task, task.task_id)

        putRequest.onsuccess = (event) => {
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
      const readRequest = (store.openCursor().onsuccess = (event) => {
        const cursor = event.target.result

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

  save(event) {
    let node = event.target

    // when deleting a subtask, grab the parent
    if (event.type === EVENT_DELETE) {
      node = event.target.parentElement
    }

    // closure event details
    const eventType = event.type
    const task = event.detail.task

    // grab root task
    let rootElement = event.target
    const pathLength = event.target.task.task_path.length
    if (pathLength > 1) {
      for (let i = 0; i < pathLength - 1; i++) {
        rootElement = rootElement.parentElement
      }
    }

    const rootTask = rootElement.task
    this.store('readwrite', (store) => {
      const putRequest = store.put(rootTask, rootTask.task_id)

      putRequest.onsuccess = (event) => {
        console.log(`Updated task ${event.target.result}`)
        if (eventType === EVENT_EXPAND) {
          // does not need a render
          return
        }
        this.dispatchEvent(
          new CustomEvent(EVENT_RENDER, {
            bubbles: true,
            detail: {
              node,
              task,
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

    request.onerror = (event) => {
      console.error(event.target.error)
    }

    return request
  }
}
