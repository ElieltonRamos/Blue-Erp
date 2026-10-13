package com.blue_erp.mobile.ui.screens.oficina.list_documents

import com.blue_erp.mobile.data.model.oficina.DocumentStatus
import com.blue_erp.mobile.data.model.oficina.DocumentType

internal fun DocumentStatus.label() = when (this) {
    DocumentStatus.DRAFT -> "Orçamento"
    DocumentStatus.APPROVED -> "Aprovado"
    DocumentStatus.IN_PROGRESS -> "Em andamento"
    DocumentStatus.COMPLETED -> "Concluído"
    DocumentStatus.CANCELED -> "Cancelado"
}

internal fun DocumentType.label() = when (this) {
    DocumentType.QUOTE -> "Orçamento"
    DocumentType.SERVICE_ORDER -> "Ordem de Serviço"
}