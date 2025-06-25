// src/main/kotlin/net/enovea/env/ThemeConfig.kt
package net.enovea.env

import io.smallrye.config.ConfigMapping

@ConfigMapping(prefix = "app.theme")
interface ThemeConfig {
    /** value of app.theme.default */
    fun default(): String

    /** value of app.theme.available as List<String> */
    fun available(): List<String>
}
