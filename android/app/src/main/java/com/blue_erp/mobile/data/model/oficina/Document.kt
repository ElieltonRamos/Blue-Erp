package com.blue_erp.mobile.data.model.oficina

enum class DocumentType { QUOTE, SERVICE_ORDER }
enum class DocumentStatus { DRAFT, APPROVED, IN_PROGRESS, COMPLETED, CANCELED }
enum class DocumentItemType { PRODUCT, SERVICE }

data class PageResponse<T>(
    val data: List<T>,
    val total: Int,
    val page: Int,
    val limit: Int,
    val totalPages: Int
)

data class DocumentItemResponse(
    val id: Int,
    val type: DocumentItemType,
    val productId: Int?,
    val productName: String?,
    val serviceId: Int?,
    val serviceName: String?,
    val userId: Int?,
    val userName: String?,
    val quantity: Double,
    val unitPrice: Double,
    val total: Double
)

data class DocumentResponse(
    val id: Int,
    val type: DocumentType,
    val status: DocumentStatus,
    val clientId: Int,
    val clientName: String,
    val assetId: Int?,
    val responsibleId: Int?,
    val responsibleName: String?,
    val total: Double,
    val items: List<DocumentItemResponse> = emptyList(),
    val approvedAt: String?,
    val finishedAt: String?,
    val createdAt: String,
    val updatedAt: String
)

data class CreateDocumentRequest(
    val type: DocumentType,
    val clientId: Int,
    val assetId: Int? = null,
    val responsibleId: Int? = null
)

data class AddDocumentItemRequest(
    val type: DocumentItemType,
    val productId: Int? = null,
    val serviceId: Int? = null,
    val userId: Int? = null,
    val quantity: Double,
    val unitPrice: Double
)

data class UpdateDocumentItemRequest(
    val quantity: Double? = null,
    val unitPrice: Double? = null,
    val userId: Int? = null
)

data class UpdateDocumentStatusRequest(val status: DocumentStatus)
data class UpdateDocumentResponsibleRequest(val responsibleId: Int)

data class SalePaymentRequest(
    val method: String, // trocar pelo enum quando eu ver o PaymentMethod
    val amount: Double,
    val change: Double? = null
)

data class FinalizeDocumentRequest(
    val discount: Double? = null,
    val cfop: String? = null,
    val payments: List<SalePaymentRequest>
)