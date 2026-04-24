package com.blue_erp.garcom_digital.util

import android.content.Context
import android.media.MediaPlayer
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MediaPlayerHelper @Inject constructor(
    @ApplicationContext private val context: Context
) {

    private var mediaPlayer: MediaPlayer? = null

    fun playNotification() {
        try {
            mediaPlayer?.release()
            mediaPlayer = null

            val resId = context.resources.getIdentifier("kitchen_notification", "raw", context.packageName)
            if (resId == 0) return

            val player = MediaPlayer.create(context, resId) ?: return
            player.setOnCompletionListener { mp: MediaPlayer -> mp.release() }
            player.start()
            mediaPlayer = player
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun release() {
        mediaPlayer?.release()
        mediaPlayer = null
    }
}