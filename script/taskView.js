const CLASS_BRANCH = 'branch'
const CLASS_LEAF = 'leaf'

const QUERY_FOCUS_NODE = 'task-node[data-focused]'
const QUERY_FOCUS_DONE = 'button[name="task-done"]'
const QUERY_FOCUS_PAUSE = 'button[name="task-pause"]'

class TaskView extends HTMLElement {
  constructor() {
    super()
    this.focusTree = null
    this.addEventListener(EVENT_RENDER, this.render.bind(this))
    this.addEventListener(EVENT_DELETE, this.delete.bind(this))
    this.addEventListener(EVENT_FOCUS, this.focus.bind(this))
  }

  delete({ detail, target }) {
    // root task delete
    if (detail?.task.id) {
      target.remove()
    }
  }

  focus(event) {
    const dialog = this.querySelector('dialog')
    // clear task names
    dialog.querySelectorAll('h2').forEach((taskName) => taskName.remove())

    dialog.showModal()
    dialog.focus()

    const initialTask = event.target
    // save initial task
    this.focusTree = initialTask

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
    dialog.addEventListener('close', () => {
      const currentTask = this.querySelector(QUERY_FOCUS_NODE)
      currentTask.blurTask()
    })

    // focus exit
    dialog.querySelector(QUERY_FOCUS_PAUSE).addEventListener('click', (e) => {
      e.stopPropagation()
      dialog.close()
    })

    // focus complete task
    dialog.querySelector(QUERY_FOCUS_DONE).addEventListener('click', (e) => {
      e.stopPropagation()

      const currentTask = this.querySelector(QUERY_FOCUS_NODE)
      // DFS - get first subtask
      let nextTask = currentTask.querySelector(ELEMENT_NODE)

      currentTask.blurTask()

      // no subtasks
      if (!nextTask) {
        // focus level ~ leaf task
        let parentTask = currentTask.parentElement

        // current task is initial focus (no more subtasks left)
        // or current task is a root task with no subtasks
        if (currentTask.equals(this.focusTree) || currentTask.isRoot()) {
          return dialog.close()
        }

        // try adjacent task
        nextTask = currentTask.nextSibling
        // no adjacent tasks
        if (!nextTask) {
          // focus level ~ singleton leaf task
          // parent task is the initial focus (last subtask of the branch)
          // or parent task is a root task
          if (parentTask.equals(this.focusTree) || parentTask.isRoot()) {
            return dialog.close()
          }
          // try uncle task
          nextTask = parentTask.nextSibling
        }

        // no direct uncle task
        // focus level ~ deep leaf task
        while (!nextTask) {
          // find the next valid ancestor task
          parentTask = parentTask.parentElement
          // quit if visited ancestor is the initial focus task
          if (parentTask.equals(this.focusTree)) {
            return dialog.close()
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
    const taskNode = this.renderTask(task)

    // root add event does not have node to replace
    if (task.id && !detail?.node) {
      // append root tasks to task-base
      return target.appendChild(taskNode)
    }

    // branching subtask
    taskNode.setAttribute('slot', SLOT_SUBS)
    // replace node with updated node
    detail.node.replaceWith(taskNode)
  }

  renderFocus(task) {
    const dialog = this.querySelector('dialog')
    // add task name
    const taskName = document.createElement('h2')
    taskName.setAttribute('slot', SLOT_NAME)
    taskName.textContent = task.name
    dialog.querySelector('header').appendChild(taskName)
  }

  renderTask(task) {
    const taskNode = document.createElement(ELEMENT_NODE)
    taskNode.task = task

    // set the task path
    taskNode.shadowRoot.querySelector('div').setAttribute('data-path', task.path)

    // fields
    const taskName = document.createElement(ELEMENT_FIELD)
    taskName.setAttribute('slot', SLOT_NAME)
    taskName.textContent = task.name
    taskNode.appendChild(taskName)

    const taskNote = document.createElement(ELEMENT_FIELD)
    taskNote.setAttribute('slot', SLOT_NOTE)
    taskNote.textContent = task.note
    taskNode.appendChild(taskNote)

    const taskState = document.createElement('select')
    taskState.setAttribute('slot', SLOT_STATE)
    task.state.options.forEach((state, index) => {
      const option = document.createElement('option')
      option.value = index
      option.textContent = state
      taskState.appendChild(option)
      if (index === task.state.current) {
        option.setAttribute('selected', '')
        taskState.value = index
      }
    })
    taskNode.appendChild(taskState)

    if (task.state.focused) {
      taskNode.setAttribute('data-focused', '')
      taskNode.shadowRoot.querySelector('div').classList.add('focused')
    }

    const container = taskNode.shadowRoot.querySelector('div')

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
      const subTask = this.renderTask(task.subs[sub])
      subTask.setAttribute('slot', SLOT_SUBS)

      taskNode.appendChild(subTask)
    }

    if (task.meta.opened) {
      taskNode.shadowRoot.querySelector('details').setAttribute('open', '')
    }

    return taskNode
  }
}
