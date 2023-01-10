package utils

import "sync"

type MutexMap[T any] struct {
	mu   sync.RWMutex
	data map[string]T
}

func NewMutexMap[T any]() *MutexMap[T] {
	return &MutexMap[T]{
		data: make(map[string]T),
	}
}

func (m *MutexMap[T]) Get(key string) (T, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	val, ok := m.data[key]
	return val, ok
}

func (m *MutexMap[T]) Set(key string, val T) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.data[key] = val
}

func (m *MutexMap[T]) Delete(key string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.data, key)
}
