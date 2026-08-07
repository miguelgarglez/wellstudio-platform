export {
  canTransitionLeadStatus,
  getAllowedLeadStatusTransitions,
  isOperableLeadStatus,
  normalizeLeadStatusTarget,
  updateAdminLeadStatus,
} from '@/modules/leads/server/admin-lead-operations'

export type {
  AdminLeadActor,
  AdminLeadOperableStatus as AdminLeadStatusTarget,
} from '@/modules/leads/server/admin-lead-operations'
