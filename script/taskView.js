const CLASS_BRANCH = 'branch'
const CLASS_LEAF = 'leaf'

class TaskView extends HTMLElement {
  constructor() {
    super()

    this.addEventListener(EVENT_RENDER, this.render.bind(this))
    this.addEventListener(EVENT_DELETE, this.delete.bind(this))
  }

  delete(event) {
    const taskElement = event.target
    if (event.detail?.isRoot) {
      taskElement.remove()
    }
  }

  render(event) {
    const task = event.detail.task
    const updatedTaskElement = this.renderTaskTree(task)
    updatedTaskElement.setAttribute('slot', 'task-subs')

    if (task.task_ui.is_open) {
      updatedTaskElement.shadowRoot.querySelector('details').setAttribute('open', '')
    }

    if (event.detail?.isRoot) {
      // append root tasks to task-base
      return event.target.appendChild(updatedTaskElement)
    }

    event.detail.taskElement.replaceWith(updatedTaskElement)
  }

  renderTaskTree(task) {
    const taskElement = document.createElement(ELEMENT_NODE)
    taskElement.task = task

    // set the task path
    taskElement.shadowRoot.querySelector('div').setAttribute('data-path', task.task_path)

    // fields
    const taskName = document.createElement(ELEMENT_FIELD)
    taskName.setAttribute('slot', 'task-name')
    taskName.textContent = task.task_name
    taskElement.appendChild(taskName)

    const taskNote = document.createElement(ELEMENT_FIELD)
    taskNote.setAttribute('slot', 'task-note')
    taskNote.textContent = task.task_note
    taskElement.appendChild(taskNote)

    // leaf
    if (!task.task_subs?.length) {
      taskElement.shadowRoot.querySelector('div').setAttribute('class', CLASS_LEAF)
      return taskElement
    }

    // branch
    taskElement.shadowRoot.querySelector('div').setAttribute('class', CLASS_BRANCH)

    const subLength = task.task_subs.length
    const numSubs = document.createElement('span')
    numSubs.setAttribute('slot', 'num-subs')
    numSubs.textContent = `Subtasks (${subLength})`
    taskElement.appendChild(numSubs)

    for (const sub in task.task_subs) {
      const subTask = this.renderTaskTree(task.task_subs[sub])
      subTask.setAttribute('slot', 'task-subs')

      taskElement.appendChild(subTask)
    }

    if (task.task_ui.is_open) {
      taskElement.shadowRoot.querySelector('details').setAttribute('open', '')
    }

    return taskElement
  }
}
