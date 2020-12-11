package net.mullvad.mullvadvpn.service.endpoint

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import net.mullvad.mullvadvpn.ipc.Request
import net.mullvad.mullvadvpn.model.KeygenEvent
import net.mullvad.talpid.util.EventNotifier

class KeyStatusListener(endpoint: ServiceEndpoint) {
    private val daemon = endpoint.intermittentDaemon

    val onKeyStatusChange = EventNotifier<KeygenEvent?>(null)

    var keyStatus by onKeyStatusChange.notifiable()

    init {
        daemon.registerListener(this) { newDaemon ->
            newDaemon?.apply {
                keyStatus = getWireguardKey()?.let { wireguardKey ->
                    KeygenEvent.NewKey(wireguardKey, null, null)
                }

                onKeygenEvent = { event -> keyStatus = event }
            }
        }

        endpoint.dispatcher.apply {
            registerHandler(Request.WireGuardGenerateKey::class) { _ ->
                generateKey()
            }

            registerHandler(Request.WireGuardVerifyKey::class) { _ ->
                verifyKey()
            }
        }
    }

    fun generateKey() = GlobalScope.launch(Dispatchers.Default) {
        val oldStatus = keyStatus
        val newStatus = daemon.await().generateWireguardKey()
        val newFailure = newStatus?.failure()
        if (oldStatus is KeygenEvent.NewKey && newFailure != null) {
            keyStatus = KeygenEvent.NewKey(
                oldStatus.publicKey,
                oldStatus.verified,
                newFailure
            )
        } else {
            keyStatus = newStatus ?: KeygenEvent.GenerationFailure()
        }
    }

    fun verifyKey() = GlobalScope.launch(Dispatchers.Default) {
        val verified = daemon.await().verifyWireguardKey()
        // Only update verification status if the key is actually there
        when (val state = keyStatus) {
            is KeygenEvent.NewKey -> {
                keyStatus = KeygenEvent.NewKey(
                    state.publicKey,
                    verified,
                    state.replacementFailure
                )
            }
        }
    }

    fun onDestroy() {
        daemon.unregisterListener(this)
        onKeyStatusChange.unsubscribeAll()
    }
}