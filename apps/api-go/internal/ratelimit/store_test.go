package ratelimit_test

import (
	"context"
	"time"
)

type FakeDb map[string]int64

type FakeStore struct {
	db  FakeDb
	err error
}

func NewFakeStore(db FakeDb, err error) *FakeStore {
	return &FakeStore{
		db:  db,
		err: err,
	}
}

func (s *FakeStore) Increment(ctx context.Context, key string, window time.Duration) (count int64, ttl time.Duration, err error) {
	if s.err != nil {
		err = s.err
		return
	}
	count = s.db[key]
	count++
	s.db[key] = count
	return
}
