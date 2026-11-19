const api = () => window.api.localData

export const localStore = {
  save: (collection, key, data) => api().save(collection, key, data),
  load: (collection, key) => api().load(collection, key),
  loadAll: (collection) => api().loadAll(collection),
  remove: (collection, key) => api().remove(collection, key),
  removeSiblings: (collection, key) => api().removeSiblings(collection, key),
}
