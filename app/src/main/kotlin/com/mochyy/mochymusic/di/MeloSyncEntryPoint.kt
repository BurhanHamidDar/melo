package com.mochyy.mochymusic.di

import com.mochyy.mochymusic.core.sync.MeloSyncManager
import dagger.hilt.EntryPoint
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent

@EntryPoint
@InstallIn(SingletonComponent::class)
interface MeloSyncEntryPoint {
    fun syncManager(): MeloSyncManager
}
