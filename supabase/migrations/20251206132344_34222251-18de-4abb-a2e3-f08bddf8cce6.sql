-- Block direct inserts to security_logs - only allow via log_security_event function (SECURITY DEFINER)
CREATE POLICY "No direct insert to security logs"
  ON public.security_logs
  FOR INSERT
  WITH CHECK (false);