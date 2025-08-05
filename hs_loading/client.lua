AddEventHandler('playerSpawned', function()
    SendNUIMessage({
        eventName = 'playerSpawned'
    })
    SetNuiFocus(false, false)
end)


Citizen.CreateThread(function()
    while true do
        Citizen.Wait(1000) 
        local isFocused = IsNuiFocused()
    end
end)