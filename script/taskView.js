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
    if (detail?.task.task_id) {
      target.remove()
    }
  }

  render({ detail, target }) {
    const task = detail.task
    const taskNode = this.renderTaskNode(task)

    // root add event does not have node to replace
    if (task.task_id && !detail?.node) {
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

    taskNode.classList.add('fade-in')

    // set the task path
    taskNode.shadowRoot.querySelector('div').setAttribute('data-path', task.task_path)

    // fields
    const taskName = document.createElement(ELEMENT_FIELD)
    taskName.setAttribute('slot', SLOT_NAME)
    taskName.textContent = task.task_name
    taskNode.appendChild(taskName)

    const taskNote = document.createElement(ELEMENT_FIELD)
    taskNote.setAttribute('slot', SLOT_NOTE)
    taskNote.textContent = task.task_note
    taskNode.appendChild(taskNote)

    // leaf
    if (!task.task_subs?.length) {
      taskNode.shadowRoot.querySelector('div').setAttribute('class', CLASS_LEAF)
      return taskNode
    }

    // branch
    taskNode.shadowRoot.querySelector('div').setAttribute('class', CLASS_BRANCH)

    const subsLength = task.task_subs.length
    const subsLabel = document.createElement(ELEMENT_LABEL)
    subsLabel.setAttribute('slot', SLOT_SUBCOUNT)
    subsLabel.textContent = `${TEXT_SUBS} (${subsLength})`
    taskNode.appendChild(subsLabel)

    for (const sub in task.task_subs) {
      const subTask = this.renderTaskNode(task.task_subs[sub])
      subTask.setAttribute('slot', SLOT_SUBS)

      taskNode.appendChild(subTask)
    }

    if (task.task_ui.is_open) {
      taskNode.shadowRoot.querySelector('details').setAttribute('open', '')
    }

    return taskNode
  }
}
