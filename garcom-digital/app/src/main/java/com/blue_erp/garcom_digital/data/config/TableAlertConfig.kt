// data/config/TableAlertConfig.kt
package com.blue_erp.garcom_digital.data.config

/**
 * Configurações de alertas para mesas
 *
 * Ajuste os tempos aqui conforme o tipo de estabelecimento:
 * - Fast Food / Bar: tempos mais curtos (5-10 min)
 * - Restaurante Casual: tempos médios (10-15 min)
 * - Restaurante Tradicional: tempos maiores (15-20 min)
 * - Fine Dining: tempos ainda maiores (20-30 min)
 */
object TableAlertConfig {

    // ========== ALERTAS DE MESA SEM PEDIDOS ==========

    /**
     * Tempo (em minutos) após ocupar mesa SEM fazer primeiro pedido
     * Exemplo: Cliente sentou há 10 minutos e ainda não pediu nada
     */
    const val FIRST_ORDER_WARNING_MINUTES = 10
    const val FIRST_ORDER_CRITICAL_MINUTES = 20

    // ========== ALERTAS DE INATIVIDADE ==========

    /**
     * Tempo (em minutos) desde o ÚLTIMO pedido
     * Exemplo: Cliente fez pedido há 30 minutos e não pediu mais nada
     */
    const val INACTIVITY_WARNING_MINUTES = 30
    const val INACTIVITY_CRITICAL_MINUTES = 45

    // ========== CORES DOS ALERTAS ==========

    object Colors {
        const val WARNING_BACKGROUND = 0xFFFFF3E0  // Laranja claro
        const val WARNING_TEXT = 0xFFFF6F00        // Laranja escuro

        const val CRITICAL_BACKGROUND = 0xFFFFEBEE // Vermelho claro
        const val CRITICAL_TEXT = 0xFFC62828       // Vermelho escuro
    }

    // ========== TEXTOS DOS ALERTAS ==========

    object Messages {
        const val NO_ORDERS_YET = "Sem pedidos"
        const val INACTIVE = "Inativo"

        fun getFirstOrderMessage(minutes: Long): String {
            return "Sem pedidos ($minutes min)"
        }

        fun getInactivityMessage(minutes: Long): String {
            return "Inativo há $minutes min"
        }
    }
}