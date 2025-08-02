const CLASS_BRANCH = 'branch'
const CLASS_LEAF = 'leaf'

class TaskView extends HTMLElement {
  constructor() {
    super()
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
    // const focusTemplate = document.getElementById(TEMPLATE_FOCUS).content.cloneNode(true)
    const dialog = this.querySelector('dialog')
    // this.prepend(dialog)
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
    const task = event.detail.task

    this.renderFocus(task)

    // update initial focused task
    task.state.current = 1
    task.state.focused = true
    initialTask.dispatch(EVENT_STATES, task)
    // on done button click
    dialog.querySelector('button[name="task-done"]').addEventListener('click', (e) => {
      e.stopImmediatePropagation()
      const currentTask = this.querySelector('task-node[data-focused]')

      // no subtasks and this is the initial task
      if (!currentTask.querySelector('task-node') && currentTask.equals(initialTask)) {
        // cleanup focus
        currentTask.task.state.focused = false
        currentTask.dispatch(EVENT_STATES, currentTask.task)
        dialog.close()
        return
      }

      let nextTask = this.querySelector('task-node[data-focused] > task-node')

      // no subtasks
      if (!nextTask) {
        nextTask = currentTask.nextSibling

        //no sibling task
        if (!nextTask) {
          let visitedTask = currentTask

          // find next uncle task
          while (!nextTask) {
            const parentTask = visitedTask.parentElement

            // root task or initial focused task
            if (
              !parentTask ||
              parentTask.tagName === ELEMENT_BASE.toUpperCase() ||
              parentTask.equals(initialTask)
            ) {
              // cleanup currently focused task
              currentTask.task.state.focused = false
              currentTask.dispatch(EVENT_STATES, currentTask.task)
              dialog.close()
              return
            }
            // uncle task
            nextTask = parentTask.nextSibling

            if (nextTask && nextTask.parentElement.tagName === ELEMENT_BASE.toUpperCase()) {
              return
            }
            // if no uncle task, recurse and look in grandparent task
            if (!nextTask) {
              visitedTask = parentTask
              // cleanup visited task
              visitedTask.task.state.focused = false
              visitedTask.dispatch(EVENT_STATES, visitedTask.task)
            }
          }
        }
      }
      // cleanup currently focused task
      currentTask.task.state.focused = false
      currentTask.dispatch(EVENT_STATES, currentTask.task)

      // update next focused task
      nextTask.task.state.current = 1
      nextTask.task.state.focused = true
      nextTask.dispatch(EVENT_STATES, nextTask.task)
      // UI focus
      nextTask.focus()
      nextTask.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      })
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
