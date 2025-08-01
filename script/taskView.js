const CLASS_BRANCH = 'branch'
const CLASS_LEAF = 'leaf'

class TaskView extends HTMLElement {
  constructor() {
    super()
    this.addEventListener(EVENT_RENDER, this.render.bind(this))
    this.addEventListener(EVENT_DELETE, this.delete.bind(this))
  }

  delete({ detail, target }) {
    // root task delete
    if (detail?.task.id) {
      target.remove()
    }
  }

  render({ detail, target }) {
    const task = detail.task
    const taskNode = this.renderTaskNode(task)

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

  renderTaskNode(task) {
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

    const container = taskNode.shadowRoot.querySelector('div')

    // leaf
    if (!task.subs?.length) {
      taskNode.setAttribute('class', CLASS_LEAF)

      container.setAttribute('class', CLASS_LEAF)
      return taskNode
    }

    // branch
    container.setAttribute('class', CLASS_BRANCH)

    const subsLength = task.subs.length
    const subsLabel = document.createElement(ELEMENT_LABEL)
    subsLabel.setAttribute('slot', SLOT_TITLE_SUBS)
    subsLabel.textContent = `${TEXT_SUBS} (${subsLength})`
    taskNode.appendChild(subsLabel)

    for (const sub in task.subs) {
      const subTask = this.renderTaskNode(task.subs[sub])
      subTask.setAttribute('slot', SLOT_SUBS)

      taskNode.appendChild(subTask)
    }

    if (task.meta.isOpen) {
      taskNode.shadowRoot.querySelector('details').setAttribute('open', '')
    }

    return taskNode
  }
}
