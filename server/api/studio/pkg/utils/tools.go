package utils

import "sync"

type mutexMap[T any] struct {
	mu   sync.RWMutex
	data map[string]T
}

func NewMutexMap[T any]() *mutexMap[T] {
	return &mutexMap[T]{
		data: make(map[string]T),
	}
}

func (m *mutexMap[T]) Get(key string) (T, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	val, ok := m.data[key]
	return val, ok
}

func (m *mutexMap[T]) Set(key string, val T) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.data[key] = val
}

func (m *mutexMap[T]) Delete(key string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.data, key)
}
func (m *mutexMap[T]) Size() int {
	m.mu.Lock()
	defer m.mu.Unlock()
	return len(m.data)
}

func (m *mutexMap[T]) ForEach(f func(key string, val T)) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	for k, v := range m.data {
		f(k, v)
	}
}

func (m *mutexMap[T]) Clear() {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.data = make(map[string]T)
}
