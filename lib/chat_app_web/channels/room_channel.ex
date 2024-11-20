defmodule ChatAppWeb.RoomChannel do
  use Phoenix.Channel

  def join("room:" <> _room_name, _params, socket) do
    {:ok, socket}
  end

  def handle_in("new_msg", %{"body" => body, "name" => name}, socket) do
    broadcast!(socket, "new_msg", %{"body" => body, "name" => name})
    {:noreply, socket}
  end

  def handle_in("user_joined", %{"name" => name}, socket) do
    broadcast!(socket, "user_joined", %{"name" => name})
    {:noreply, socket}
  end
end
