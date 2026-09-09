-- Support the ownership-aware RLS predicates without changing historical data.
create index if not exists idx_messages_sender_id
  on public.messages (sender_id);
create index if not exists idx_messages_receiver_type_id
  on public.messages (receiver_type, receiver_id);
