export function humanizeActivityAction(action: string): string {
    return action.replace(/[_-]+/g, ' ').trim()
}
