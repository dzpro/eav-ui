﻿using System.Collections.Generic;
using System.Linq;

namespace ToSic.Eav.Persistence
{
    public class Metadata
    {
        /// <summary>
        /// Get Entities describing the Attribute (e.g. General and @String)
        /// </summary>
        public Dictionary<string, IAttribute> GetAttributeMetaData(int attributeId, int zoneId, int appId)
        {
            // Get all EntityIds describing the Attribute (e.g. General and @String)
            var entities = DataSource.GetMetaDataSource(zoneId, appId).GetAssignedEntities(Constants.AssignmentObjectTypeIdFieldProperties, attributeId);
            // Return all Attributes of all Entities with Value
            return entities.SelectMany(e => e.Attributes).ToDictionary(a => a.Key, a => a.Value);
        }
    }
}