﻿using System;
using System.Collections.Generic;
using System.Linq;

namespace ToSic.Eav.WebApi
{
	/// <summary>
	/// Web API Controller for MetaData
	/// Metadata-entities (content-items) are additional information about some other object
	/// </summary>
	public class MetadataController : Eav3WebApiBase
    {
        #region AssignedEntities - these are entities which have been assigned to something else
        /// <summary>
		/// Get Entities with specified AssignmentObjectTypeId and Key
		/// </summary>
		public IEnumerable<Dictionary<string, object>> GetAssignedEntities(int assignmentObjectTypeId, Guid keyGuid, string contentType, int? appId = null)
        {
            if (appId.HasValue)
                AppId = appId.Value;
            var entityList = MetaDS.GetAssignedEntities(assignmentObjectTypeId, keyGuid, contentType);
            return Serializer.Prepare(entityList);
        }

        /// <summary>
        /// Get Entities with specified AssignmentObjectTypeId and Key
        /// </summary>
        public IEnumerable<Dictionary<string, object>> GetAssignedEntities(int assignmentObjectTypeId, string keyString, string contentType, int? appId = null)
        {
            if (appId.HasValue)
                AppId = appId.Value;
            var entityList = MetaDS.GetAssignedEntities(assignmentObjectTypeId, keyString, contentType);
            return Serializer.Prepare(entityList);
        }
        #endregion

    }
}