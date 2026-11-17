package com.mochyy.mochymusic.core.share

/**
 * Centralized utility for constructing shareable Melo links.
 * All shared links route to your free Firebase domain (melo-v2.web.app) with 100% free HTTPS,
 * which either deep links directly into the Melo Android app or displays a rich web preview with Open Graph tags.
 */
object MeloShareUrl {
    // 100% Free Firebase domain attached to your project
    const val DOMAIN = "melo-v2.web.app"
    const val BASE_URL = "https://$DOMAIN"

    fun track(id: String): String = "$BASE_URL/track/$id"
    fun song(id: String): String = "$BASE_URL/song/$id"
    fun playlist(id: String): String = "$BASE_URL/playlist/$id"
    fun album(id: String): String = "$BASE_URL/album/$id"
    fun artist(id: String): String = "$BASE_URL/artist/$id"
}
