defmodule ChatAppWeb.UserSocket do
  use Phoenix.Socket

  # Define the "room:lobby" topic
  channel "room:*", ChatAppWeb.RoomChannel

  # Connect function (optional, can be extended for authentication)
  def connect(_params, socket, _connect_info) do
    {:ok, socket}
  end

  # Fallback for unverified connections
  def id(_socket), do: nil
end
