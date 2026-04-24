package com.blue_erp.garcom_digital.data.repository

import com.blue_erp.garcom_digital.data.api.ApiService
import com.blue_erp.garcom_digital.data.model.KitchenOrderItem
import com.blue_erp.garcom_digital.data.model.PreparationStep
import com.blue_erp.garcom_digital.data.model.ProductionLocationResponse
import com.blue_erp.garcom_digital.data.model.ProductionStatus
import com.blue_erp.garcom_digital.util.Resource
import com.blue_erp.garcom_digital.util.parseNetworkError
import org.json.JSONObject
import retrofit2.Response
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class KitchenRepository @Inject constructor(
    private val apiService: ApiService
) {

    private fun parseError(response: Response<*>, fallback: String): String {
        return when (response.code()) {
            401 -> "Sessão expirada. Faça login novamente."
            403 -> "Sem permissão para esta ação."
            404 -> "Registro não encontrado."
            500, 502, 503 -> "Servidor indisponível. Tente mais tarde."
            else -> try {
                val json = response.errorBody()?.string()
                JSONObject(json ?: "").getString("message")
            } catch (e: Exception) {
                fallback
            }
        }
    }

    suspend fun getKitchenOrders(productionLocation: String?): Resource<List<KitchenOrderItem>> {
        return try {
            val response = if (productionLocation != null) {
                apiService.getKitchenOrdersByLocation(productionLocation)
            } else {
                apiService.getKitchenOrders()
            }
            if (response.isSuccessful) {
                val items = response.body()?.map { prod ->
                    KitchenOrderItem(
                        id = prod.orderItem.id,
                        productId = prod.orderItem.product.id,
                        name = prod.orderItem.name,
                        code = prod.orderItem.code,
                        quantity = prod.orderItem.quantity ?: prod.quantityRequested,
                        observation = prod.observation,
                        preparationSteps = prod.orderItem.product.preparationSteps?.map {
                            PreparationStep(
                                id = it.id,
                                order = it.order,
                                description = it.description,
                                productId = it.productId,
                                createdAt = it.createdAt,
                                updatedAt = it.updatedAt
                            )
                        },
                        productionId = prod.id,
                        productionStatus = mapStatus(prod.status),
                        productionLocation = prod.productionLocation,
                        pendingAt = prod.pendingAt,
                        startedAt = prod.startedAt,
                        completedAt = prod.completedAt,
                        pendingDuration = prod.pendingDuration,
                        inProgressDuration = prod.inProgressDuration,
                        totalDuration = prod.totalDuration,
                        orderId = prod.orderItem.order.id,
                        orderNumber = "${prod.orderItem.order.id}",
                        table = prod.orderItem.order.table,
                        customerName = prod.orderItem.order.customerName,
                        type = prod.orderItem.order.type,
                        kitchen = formatKitchenName(prod.productionLocation)
                    )
                } ?: emptyList()
                Resource.Success(items)
            } else {
                Resource.Error(parseError(response, "Erro ao buscar pedidos da cozinha"))
            }
        } catch (e: Exception) {
            Resource.Error(parseNetworkError(e))
        }
    }

    suspend fun getLocations(): Resource<List<ProductionLocationResponse>> {
        return try {
            val response = apiService.getLocations()
            if (response.isSuccessful) {
                response.body()?.let { Resource.Success(it) }
                    ?: Resource.Error("Erro ao buscar locais")
            } else {
                Resource.Error(parseError(response, "Erro ao buscar locais"))
            }
        } catch (e: Exception) {
            Resource.Error(parseNetworkError(e))
        }
    }

    suspend fun startPreparingItem(productionId: Int): Resource<Unit> {
        return try {
            val response = apiService.startProduction(productionId)
            if (response.isSuccessful) Resource.Success(Unit)
            else Resource.Error(parseError(response, "Erro ao iniciar preparo"))
        } catch (e: Exception) {
            Resource.Error(parseNetworkError(e))
        }
    }

    suspend fun completeItem(productionId: Int): Resource<Unit> {
        return try {
            val response = apiService.completeProduction(productionId)
            if (response.isSuccessful) Resource.Success(Unit)
            else Resource.Error(parseError(response, "Erro ao completar item"))
        } catch (e: Exception) {
            Resource.Error(parseNetworkError(e))
        }
    }

    suspend fun deliverItem(productionId: Int): Resource<Unit> {
        return try {
            val response = apiService.deliverProduction(productionId)
            if (response.isSuccessful) Resource.Success(Unit)
            else Resource.Error(parseError(response, "Erro ao entregar item"))
        } catch (e: Exception) {
            Resource.Error(parseNetworkError(e))
        }
    }

    suspend fun cancelProduction(productionId: Int): Resource<Unit> {
        return try {
            val response = apiService.cancelProduction(productionId)
            if (response.isSuccessful) Resource.Success(Unit)
            else Resource.Error(parseError(response, "Erro ao cancelar item"))
        } catch (e: Exception) {
            Resource.Error(parseNetworkError(e))
        }
    }

    private fun mapStatus(status: String): ProductionStatus = when (status) {
        "PENDING"     -> ProductionStatus.PENDING
        "IN_PROGRESS" -> ProductionStatus.IN_PROGRESS
        "COMPLETED"   -> ProductionStatus.COMPLETED
        "CANCELED"    -> ProductionStatus.CANCELED
        else          -> ProductionStatus.PENDING
    }

    private fun formatKitchenName(location: String): String = when (location) {
        "LOCAL_01" -> "Cozinha 1"
        "LOCAL_02" -> "Cozinha 2"
        "LOCAL_03" -> "Cozinha 3"
        "DELIVERY" -> "Delivery"
        else       -> location
    }
}