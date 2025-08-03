const CLASS_BRANCH = 'branch'
const CLASS_LEAF = 'leaf'

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
    dialog.showModal()

    // escape
    dialog.addEventListener('keyup', (e) => {
      e.stopPropagation()

      if (e.key === 'Escape') {
        const currentTask = this.querySelector('task-node[data-focused]')
        currentTask.task.state.focused = false
        currentTask.dispatch(EVENT_STATES, currentTask.task)
        dialog.close()
      }
    })
    // pause
    dialog.querySelector('button[name="task-pause"]').addEventListener('click', (e) => {
      e.stopPropagation()
      const currentTask = this.querySelector('task-node[data-focused]')
      currentTask.task.state.focused = false
      currentTask.dispatch(EVENT_STATES, currentTask.task)
      dialog.close()
    })

    const initialTask = event.target
    // save initial task
    this.focusTree = initialTask

    initialTask.focusTask()
    this.renderFocus(initialTask.task)

    // on done button click
    dialog.querySelector('button[name="task-done"]').addEventListener('click', (e) => {
      e.stopImmediatePropagation()

      const currentTask = this.querySelector('task-node[data-focused]')
      // DFS - get first subtask
      let nextTask = currentTask.querySelector('task-node')

      currentTask.blurTask()

      // no subtasks
      if (!nextTask) {
        // current focus ~ leaf task
        // try adjacent task
        nextTask = currentTask.nextSibling
        let parentTask = currentTask.parentElement

        // no adjacent tasks
        if (!nextTask) {
          // current focus ~ singleton leaf task
          // quit tree walk when current focus is:
          // root task with no subtasks
          // initial focus task (no more subtasks left)
          // last subtask of the initial focus task
          if (
            currentTask.isRoot() ||
            currentTask.equals(this.focusTree) ||
            parentTask.equals(this.focusTree)
          ) {
            return dialog.close()
          }
          // try uncle task
          nextTask = parentTask.nextSibling
        }

        // no direct uncle task
        // current focus ~ deep leaf task
        while (!nextTask) {
          // find the next valid ancestor task
          parentTask = parentTask.parentElement

          // quit if visited ancestor is the initial focus task
          if (parentTask.equals(this.focusTree)) {
            return dialog.close()
          }

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

    dialog.querySelector(`${ELEMENT_FIELD}[slot="${SLOT_NAME}"]`)?.remove()

    const taskName = document.createElement(ELEMENT_FIELD)
    taskName.setAttribute('slot', SLOT_NAME)
    taskName.textContent = task.name
    dialog.querySelector('header').appendChild(taskName)

    dialog.querySelector(`[slot="${SLOT_NAME}"]`).textContent = task.name
  }

  renderTask(task) {
    const taskNode = document.createElement(ELEMENT_NODE)
    taskNode.task = task
    // fade in tasks, prevents FOUC
    taskNode.classList.add('fade-in')

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

    if (task.meta.isOpen) {
      taskNode.shadowRoot.querySelector('details').setAttribute('open', '')
    }

    return taskNode
  }
}
