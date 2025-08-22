const CLASS_BRANCH = 'branch'
const CLASS_LEAF = 'leaf'

const QUERY_FOCUS_NODE = 'task-node[data-focused]'
const QUERY_FOCUS_DONE = 'button[name="task-done"]'
const QUERY_FOCUS_PAUSE = 'button[name="task-pause"]'

class TaskView extends HTMLElement {
  constructor() {
    super()
    this.focusTask = null
    this.editMode = false
    this.addEventListener(EVENT_RENDER, this.render.bind(this))
    this.addEventListener(EVENT_DELETE, this.delete.bind(this))
    this.addEventListener(EVENT_FOCUS, this.focusTree.bind(this))
    this.addEventListener(EVENT_EDIT, this.render.bind(this))
  }

  blurTree() {
    const dialog = this.querySelector('dialog')
    dialog.close()

    const taskId = this.focusTask.task.id
    const taskPath = this.focusTask.task.path.toString()

    if (taskId) {
      this.querySelector(`task-node[data-id="${taskId}"]`).scrollIntoView({
        behavior: 'smooth',
      })
    } else {
      this.querySelector(`task-node[data-path="${taskPath}"]`)
        .shadowRoot.querySelector('div')
        .scrollIntoView({
          behavior: 'smooth',
        })
    }

    // cleanup
    dialog.querySelectorAll('ul li').forEach((taskName) => taskName.remove())
    dialog.querySelector('header h1').remove()
    document.querySelector('main').classList.remove('focused')
  }

  delete({ detail, target }) {
    // root task delete
    if (detail?.task.id) {
      target.remove()
    }
  }

  focusTree(event) {
    document.querySelector('main').classList.add('focused')

    const dialog = this.querySelector('dialog')

    dialog.showModal()
    dialog.focus()

    const initialTask = event.target
    // save initial task
    this.focusTask = initialTask

    initialTask.focusTask()
    this.renderFocus(initialTask.task)
  }

  init() {
    const dialog = document
      .getElementById(TEMPLATE_FOCUS)
      .content.cloneNode(true)
      .querySelector('dialog')
    this.prepend(dialog)

    // focus exit
    dialog.addEventListener('close', (e) => {
      const currentTask = this.querySelector(QUERY_FOCUS_NODE)
      currentTask.blurTask()
    })

    // focus exit
    dialog.querySelector(QUERY_FOCUS_PAUSE).addEventListener('click', (e) => {
      e.stopPropagation()
      const currentTask = this.querySelector(QUERY_FOCUS_NODE)
      // pause current task
      currentTask.blurTask(2)

      let parentTask = currentTask.parentElement

      if (!parentTask.task) {
        return this.blurTree()
      }
      // pause parent task if active
      if (parentTask.task.state.current === 1) {
        parentTask.blurTask(2)
      }
      // pause all the ancestors as well, only if ancestor is active
      while (!parentTask.equals(this.focusTask) && parentTask.task.state.current === 1) {
        parentTask = parentTask.parentElement
        parentTask.blurTask(2)
      }
      // exit focus
      this.blurTree()
    })

    // focus complete task
    dialog.querySelector(QUERY_FOCUS_DONE).addEventListener('click', (e) => {
      e.stopPropagation()

      const currentTask = this.querySelector(QUERY_FOCUS_NODE)
      // DFS - get first subtask
      let nextTask = currentTask.querySelector(ELEMENT_NODE)

      // do not set task as done (3) unless it has children
      // this only removes focus
      currentTask.blurTask()

      // no subtasks
      if (!nextTask) {
        // set task as done because no children
        currentTask.blurTask(3)
        // focus level ~ leaf task
        let parentTask = currentTask.parentElement
        // current task is initial focus (no more subtasks left)
        // or current task is a root task with no subtasks
        if (currentTask.equals(this.focusTask) || currentTask.isRoot()) {
          currentTask.blurTask(3)
          return this.blurTree()
        }

        // currentTask.blurTask(3)
        // try adjacent task
        nextTask = currentTask.nextSibling
        // no adjacent tasks
        if (!nextTask) {
          // set parent task as done since all children tasks are done
          parentTask.blurTask(3)
          // focus level ~ singleton leaf task
          // parent task is the initial focus (last subtask of the branch)
          // or parent task is a root task
          if (parentTask.equals(this.focusTask) || parentTask.isRoot()) {
            return this.blurTree()
          }
          // try uncle task
          nextTask = parentTask.nextSibling
        }

        // no direct uncle task
        // focus level ~ deep leaf task
        while (!nextTask) {
          // find the next valid ancestor task
          parentTask = parentTask.parentElement
          // set parent task as done since all children tasks are done
          parentTask.blurTask(3)
          // quit if visited ancestor is the initial focus task
          if (parentTask.equals(this.focusTask)) {
            return this.blurTree()
          }
          // valid ancestor relative found
          nextTask = parentTask.nextSibling
        }
      }

      nextTask.focusTask()
      this.renderFocus(nextTask.task)
    })
  }

  render({ detail, target }) {
    const task = detail.task
    const taskNode = this.renderTree(task)

    // root add event does not have node to replace
    if (task.id && !detail?.node) {
      // append root tasks to task-base
      target.appendChild(taskNode)
      // TODO: scroll adding root into view (requires more info from event?)
      // return taskNode.scrollIntoView({ behavior: 'smooth' })
      return
    }

    // branching subtask
    taskNode.setAttribute('slot', SLOT_SUBS)
    // replace node with updated node
    detail.node.replaceWith(taskNode)
  }

  renderFocus(task) {
    const dialog = this.querySelector('dialog')
    const focusTitleEl = dialog.querySelector('header h1')
    const focusNoteEl = dialog.querySelector('header p')
    // try to get the current focus task name
    const focusTaskName = focusTitleEl?.textContent

    if (!focusTaskName) {
      const focusTitle = document.createElement('h1')
      focusTitle.setAttribute('slot', 'task-focus-name')
      focusTitle.textContent = task.name
      dialog.querySelector('header').prepend(focusTitle)
    } else {
      focusTitleEl.textContent = task.name
      // completed task list
      const taskName = document.createElement('li')
      taskName.setAttribute('slot', SLOT_NAME)
      taskName.textContent = focusTaskName
      dialog.querySelector('ul').prepend(taskName)
    }

    if (!focusNoteEl && task.note && task.note.length) {
      const focusNote = document.createElement('p')
      focusNote.setAttribute('slot', 'task-focus-note')
      focusNote.textContent = task.note
      dialog.querySelector('header').appendChild(focusNote)
    } else {
      focusNoteEl.textContent = task.note
    }
  }

  renderTree(task) {
    const taskNode = document.createElement(ELEMENT_NODE)
    taskNode.init(task, this.editMode)

    const container = taskNode.shadowRoot.querySelector('div')

    // set the task path
    taskNode.setAttribute('data-path', task.path)
    if (task.id) {
      // only root tasks have id
      taskNode.setAttribute('data-id', task.id)
    }

    // fields
    if (taskNode.shadowRoot.querySelector('slot[name="task-name"]')) {
      const taskName = document.createElement(ELEMENT_FIELD)
      taskName.setAttribute('slot', SLOT_NAME)
      taskName.textContent = task.name

      taskNode.appendChild(taskName)
    }

    if (!task.meta.editing) {
      if (task.note && task.note.length) {
        taskNode.shadowRoot.querySelector('[part="task-note"]').setAttribute('data-note', task.note)
      } else {
        taskNode.shadowRoot.querySelector('[part="task-note"]').remove()
      }
    }

    if (
      taskNode.shadowRoot.querySelector('slot[name="task-note"]') &&
      task.note &&
      task.note.length
    ) {
      const taskNote = document.createElement(ELEMENT_FIELD)
      taskNote.setAttribute('slot', SLOT_NOTE)
      taskNote.textContent = task.note
      taskNode.appendChild(taskNote)
    }

    const taskState = document.createElement('select')
    taskState.setAttribute('slot', SLOT_STATE)
    let currentState = ''
    task.state.options.forEach((state, index) => {
      const option = document.createElement('option')
      option.value = index
      option.textContent = state
      taskState.appendChild(option)
      if (index === task.state.current) {
        currentState = state
        option.setAttribute('selected', '')
        taskState.value = index
      }
    })
    // set class to current state name
    taskState.classList.add(currentState)
    taskNode.appendChild(taskState)

    // state class and attributes on container
    container.classList.add(currentState)
    if (task.state.focused) {
      taskNode.setAttribute('data-focused', '')
      container.classList.add('focused')
    }

    // leaf
    if (!task.subs?.length) {
      container.classList.add(CLASS_LEAF)
      return taskNode
    }

    // branch
    container.classList.add(CLASS_BRANCH)

    const subsLength = task.subs.length
    const subsLabel = document.createElement(ELEMENT_LABEL)
    subsLabel.setAttribute('slot', SLOT_TITLE_SUBS)
    subsLabel.textContent = `${TEXT_SUBS} (${subsLength})`
    taskNode.appendChild(subsLabel)

    for (const sub in task.subs) {
      const subTask = this.renderTree(task.subs[sub])
      subTask.setAttribute('slot', SLOT_SUBS)

      taskNode.appendChild(subTask)
    }

    if (task.meta.opened) {
      taskNode.shadowRoot.querySelector('details').setAttribute('open', '')
    }

    return taskNode
  }
}
