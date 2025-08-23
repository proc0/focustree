const QUERY_FOCUS_DONE = 'button[name="task-done"]'
const QUERY_FOCUS_PAUSE = 'button[name="task-pause"]'

class TaskFocus extends HTMLDialogElement {
  seed = null

  constructor() {
    super()
  }

  connectedCallback() {
    const focusTemplate = document.getElementById(TEMPLATE_FOCUS)
    this.append(focusTemplate.content.cloneNode(true))
    this.bindEvents()
  }

  bindEvents() {
    // focus exit
    this.addEventListener('close', (e) => {
      e.stopPropagation()
      const focusNode = this.parentElement.getTaskNode()
      focusNode.blurTask()
    })

    // focus exit
    this.querySelector(QUERY_FOCUS_PAUSE).addEventListener('click', (e) => {
      e.stopPropagation()
      const focusNode = this.parentElement.getTaskNode()
      // pause current task
      focusNode.blurTask(2)

      let parentNode = focusNode.parentElement

      if (!parentNode.task) {
        return this.hideFocus()
      }
      // pause parent task if active
      if (parentNode.task.state === 1) {
        parentNode.blurTask(2)
      }
      // pause all the ancestors as well, only if ancestor is active
      while (!parentNode.equals(this.seed) && parentNode.task.state === 1) {
        parentNode = parentNode.parentElement
        parentNode.blurTask(2)
      }
      // exit focus
      this.hideFocus()
    })

    // focus complete task
    this.querySelector(QUERY_FOCUS_DONE).addEventListener('click', (e) => {
      e.stopPropagation()

      const focusNode = this.parentElement.getTaskNode()
      // DFS - get first subtask
      let nextNode = focusNode.querySelector(TAG_NODE)

      // do not set task as done (3) unless it has children
      // this only removes focus
      focusNode.blurTask()

      // no subtasks
      if (!nextNode) {
        // set task as done because no children
        focusNode.blurTask(3)
        // focus level ~ leaf task
        let parentNode = focusNode.parentElement
        // current task is initial focus (no more subtasks left)
        // or current task is a root task with no subtasks
        if (focusNode.equals(this.seed) || focusNode.isRoot()) {
          focusNode.blurTask(3)
          return this.hideFocus()
        }

        // focusNode.blurTask(3)
        // try adjacent task
        nextNode = focusNode.nextSibling
        // no adjacent tasks
        if (!nextNode) {
          // set parent task as done since all children tasks are done
          parentNode.blurTask(3)
          // focus level ~ singleton leaf task
          // parent task is the initial focus (last subtask of the branch)
          // or parent task is a root task
          if (parentNode.equals(this.seed) || parentNode.isRoot()) {
            return this.hideFocus()
          }
          // try uncle task
          nextNode = parentNode.nextSibling
        }

        // no direct uncle task
        // focus level ~ deep leaf task
        while (!nextNode) {
          // find the next valid ancestor task
          parentNode = parentNode.parentElement
          // set parent task as done since all children tasks are done
          parentNode.blurTask(3)
          // quit if visited ancestor is the initial focus task
          if (parentNode.equals(this.seed)) {
            return this.hideFocus()
          }
          // valid ancestor relative found
          nextNode = parentNode.nextSibling
        }
      }

      nextNode.focusTask()
      this.renderFocus(nextNode.task)
    })
  }

  hideFocus() {
    const taskNode = this.parentElement.getTaskNode(this.seed.task)
    taskNode.scrollIntoView({ behavior: 'smooth' })

    this.close()
    // cleanup
    this.seed = null
    this.querySelectorAll('ul li').forEach((taskName) => taskName.remove())
    this.querySelector('header h1').remove()
    document.querySelector('main').classList.remove('focused')
  }

  renderFocus(task) {
    // const dialog = this.querySelector('dialog')
    const focusTitleEl = this.querySelector('header h1')
    const focusNoteEl = this.querySelector('header p')

    if (focusTitleEl) {
      const focusTaskName = focusTitleEl.textContent
      focusTitleEl.textContent = task.name
      // completed task list
      const taskName = document.createElement('li')
      taskName.setAttribute('slot', NAME_NAME)
      taskName.textContent = focusTaskName
      this.querySelector('ul').prepend(taskName)
    } else {
      const focusTitle = document.createElement('h1')
      focusTitle.setAttribute('slot', 'task-focus-name')
      focusTitle.textContent = task.name
      this.querySelector('header').prepend(focusTitle)
    }

    if (focusNoteEl) {
      focusNoteEl.textContent = task.note
    } else {
      const focusNote = document.createElement('p')
      focusNote.setAttribute('slot', 'task-focus-note')
      focusNote.textContent = task.note
      this.querySelector('header').appendChild(focusNote)
    }
  }

  showFocus(node) {
    document.querySelector('main').classList.add('focused')
    // cache initial task
    this.seed = node

    this.renderFocus(node.task)
    this.showModal()
    this.focus()
  }
}
