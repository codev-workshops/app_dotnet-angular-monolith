# Normalize non-deterministic fields (timestamps) so golden datasets can be
# compared byte-for-byte across runs. Object key order is preserved (NOT sorted)
# so that any key-ordering drift is still caught as a diff.
walk(
  if type == "object" then
    with_entries(
      if (.key == "createdAt" or .key == "lastRestocked" or .key == "orderDate")
      then .value = "<TS>"
      else .
      end
    )
  else .
  end
)
